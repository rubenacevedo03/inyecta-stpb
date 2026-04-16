import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

function calcAmort(principal: number, tasaAnual: number, meses: number, fechaInicio: Date) {
  const r = tasaAnual / 12;
  const factor = Math.pow(1 + r, meses);
  const PMT = r === 0 ? principal / meses : (principal * r * factor) / (factor - 1);
  const filas: any[] = [];
  let saldo = principal;
  let totalIntereses = 0;
  for (let i = 1; i <= meses; i++) {
    const interes = saldo * r;
    const capital = PMT - interes;
    totalIntereses += interes;
    saldo = Math.max(0, saldo - capital);
    const base = fechaInicio;
    const baseDay = base.getDate();
    const totalMonths = base.getMonth() + (i - 1);
    const yr = base.getFullYear() + Math.floor(totalMonths / 12);
    const mo = ((totalMonths % 12) + 12) % 12;
    const maxDay = new Date(yr, mo + 1, 0).getDate();
    const fecha = new Date(yr, mo, Math.min(baseDay, maxDay));
    filas.push({ mes: i, fecha, pagoCapital: r2(capital), pagoIntereses: r2(interes), pagoTotal: r2(PMT), saldo: r2(saldo) });
  }
  return { filas, pmt: r2(PMT), totalIntereses: r2(totalIntereses), totalPagado: r2(PMT * meses), saldoInicial: principal };
}
function r2(n: number) { return Math.round(n * 100) / 100; }

// GET /api/operaciones
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, producto } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (producto) where.producto = producto;
    const ops = await prisma.operacion.findMany({
      where,
      include: {
        ejecutivo: { select: { id: true, nombre: true } },
        inversionistas: true,
        bloques: { orderBy: { numeroBloque: 'asc' } },
        _count: { select: { pagos: true, solicitudes: true } },
      },
      orderBy: { creadoEn: 'desc' },
    });
    res.json(ops);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/operaciones/:id
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const op = await prisma.operacion.findUnique({
      where: { id: req.params.id as string },
      include: {
        ejecutivo: { select: { id: true, nombre: true, email: true } },
        creadoPor: { select: { id: true, nombre: true } },
        inversionistas: { orderBy: { orden: 'asc' } },
        bloques: {
          include: { checklistItems: { orderBy: { orden: 'asc' } } },
          orderBy: { numeroBloque: 'asc' },
        },
        pagos: { orderBy: { numeroPago: 'asc' } },
        documentos: { orderBy: { creadoEn: 'asc' } },
        solicitudes: { include: { generadaPor: { select: { nombre: true } }, dirigidaA: { select: { nombre: true } } }, orderBy: { creadoEn: 'desc' } },
        historial: { include: { usuario: { select: { nombre: true, rol: true } } }, orderBy: { creadoEn: 'asc' } },
      },
    });
    if (!op) { res.status(404).json({ error: 'Operación no encontrada' }); return; }
    res.json(op);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/operaciones
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      nombre, producto, acreditadoNombre, acreditadoRfc, acreditadoTipo,
      acreditadoTelefono, acreditadoEmail, acreditadoDireccion,
      ejecutivoId, monto, tasaAnual, plazoMeses, fechaPrimerPago,
      comisionApertura, costosFijos, spreadSofom, adminFideicomiso,
      comisionCobranza, sofomComoAcreditante, sofomMonto, sofomTasaNeta,
      valorInmueble, notas, inversionistas,
    } = req.body;

    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const folio = `INY-${y}${m}-${rand}`;
    const ltv = valorInmueble && monto ? monto / valorInmueble : null;

    // Create operation with initial blocks
    const op = await prisma.operacion.create({
      data: {
        folio, nombre, producto, status: 'PROSPECTO',
        acreditadoNombre, acreditadoRfc, acreditadoTipo: acreditadoTipo || 'PF',
        acreditadoTelefono, acreditadoEmail, acreditadoDireccion,
        ejecutivoId: ejecutivoId || req.user!.id,
        creadoPorId: req.user!.id,
        monto, tasaAnual, plazoMeses,
        fechaPrimerPago: new Date(fechaPrimerPago),
        comisionApertura: comisionApertura ?? 0.03,
        costosFijos: costosFijos ?? 0,
        spreadSofom, adminFideicomiso, comisionCobranza,
        sofomComoAcreditante: sofomComoAcreditante ?? false,
        sofomMonto, sofomTasaNeta,
        valorInmueble, ltv, notas,
        inversionistas: inversionistas ? {
          create: inversionistas.map((inv: any, idx: number) => ({
            nombre: inv.nombre,
            monto: inv.monto || monto * inv.porcentaje,
            porcentaje: inv.porcentaje || inv.monto / monto,
            tasaNeta: inv.tasaNeta,
            orden: idx,
            esSofom: inv.esSofom ?? false,
          })),
        } : undefined,
        // Create 5 empty blocks
        bloques: {
          create: [1, 2, 3, 4, 5].map(num => ({
            numeroBloque: num,
            status: num === 1 ? 'EN_PROCESO' : 'PENDIENTE',
            slaHoras: [1, 3].includes(num) ? 72 : null,
            checklistItems: { create: getChecklistItems(num, producto) },
          })),
        },
      },
      include: { bloques: { include: { checklistItems: true } }, inversionistas: true },
    });

    // Generate payment schedule
    const amort = calcAmort(monto, tasaAnual, plazoMeses, new Date(fechaPrimerPago));
    await prisma.pagoMensual.createMany({
      data: amort.filas.map((fila: any) => ({
        operacionId: op.id,
        numeroPago: fila.mes,
        fechaVencimiento: fila.fecha,
        capitalTotal: fila.pagoCapital,
        interesTotal: fila.pagoIntereses,
        pagoTotal: fila.pagoTotal,
        saldo: fila.saldo,
      })),
    });

    // Log history
    await prisma.historialMovimiento.create({
      data: {
        operacionId: op.id,
        usuarioId: req.user!.id,
        tipo: 'CREACION',
        descripcion: `Operación ${folio} creada`,
        detalle: `Producto: ${producto} | Monto: $${monto.toLocaleString()} | Plazo: ${plazoMeses} meses`,
      },
    });

    res.status(201).json(op);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/operaciones/:id/status
router.patch('/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, motivo } = req.body;
    const op = await prisma.operacion.update({
      where: { id: req.params.id as string },
      data: { status },
    });
    await prisma.historialMovimiento.create({
      data: {
        operacionId: op.id,
        usuarioId: req.user!.id,
        tipo: 'CAMBIO_ESTATUS',
        descripcion: `Estatus cambiado a ${status}`,
        detalle: motivo,
      },
    });
    res.json(op);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/operaciones/:id/corrida
router.get('/:id/corrida', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { tipo, inversionistaId } = req.query as { tipo: string; inversionistaId?: string };
    const op = await prisma.operacion.findUnique({
      where: { id: req.params.id as string },
      include: { inversionistas: true },
    });
    if (!op) { res.status(404).json({ error: 'No encontrado' }); return; }
    let amort, nombre, participacion: number | null = null;
    if (tipo === 'acreditado') {
      amort = calcAmort(op.monto, op.tasaAnual, op.plazoMeses, op.fechaPrimerPago);
      nombre = op.acreditadoNombre;
    } else if (tipo === 'inversionista' && inversionistaId) {
      const inv = op.inversionistas.find(i => i.id === inversionistaId);
      if (!inv) { res.status(404).json({ error: 'Inversionista no encontrado' }); return; }
      amort = calcAmort(inv.monto, inv.tasaNeta, op.plazoMeses, op.fechaPrimerPago);
      nombre = inv.nombre;
      participacion = inv.porcentaje;
    } else {
      res.status(400).json({ error: 'tipo requerido' }); return;
    }
    res.json({ amort, nombre, participacion, operacion: op });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Helper: generate default checklist items per block and product
function getChecklistItems(bloque: number, producto: string) {
  const items: { descripcion: string; categoria: string; orden: number }[] = [];
  if (bloque === 1) {
    const riesgos = [
      'Análisis de buró de crédito — carga financiera',
      'Análisis de estados financieros — estructura de la empresa',
      'Comportamiento del ingreso bancario (estado de cuenta depurado)',
      'Coherencia fiscal vs. ingresos',
      'Análisis integral de capacidad de pago vs. carga financiera',
      'Viabilidad preliminar de garantía',
      'Perfil de la operación (estructura, avales, condiciones)',
    ];
    if (producto === 'PYME') riesgos.unshift('Sellos y certificados digitales');
    riesgos.forEach((d, i) => items.push({ descripcion: d, categoria: 'RIESGOS', orden: i }));
  } else if (bloque === 2) {
    const comercial = [
      'Integración documental completa',
      'Validación de documentos (cotejo)',
      'Sellos y firmas de cotejo en el expediente',
      producto === 'PYME' ? 'Visita ocular al negocio' : 'Verificación de domicilio',
      'Solicitud CLG ante RPP o solicitud directa al cliente',
    ];
    comercial.forEach((d, i) => items.push({ descripcion: d, categoria: 'COMERCIAL', orden: i }));
  } else if (bloque === 3) {
    const juridico = [
      'Validación societaria (SIGER) — PM',
      'Dictamen corporativo',
      'Consultas legales de intervinientes (PF y PM)',
      'Dictamen de garantías — inmueble / prenda',
      'Validación CLG (garantías hipotecarias) o RUG + sellos (prendarias)',
      'Validación de garantes',
      'Validación de avales',
    ];
    juridico.forEach((d, i) => items.push({ descripcion: d, categoria: 'JURIDICO', orden: i }));
  } else if (bloque === 4) {
    const comercial = [
      'Entrega de solicitud',
      'Entrega de reporte de visita',
      'Entrega de reporte cualitativo del Área Comercial',
    ];
    const riesgos = [
      'Revisión final del expediente debidamente integrado',
      'Solicitud de avalúo',
    ];
    comercial.forEach((d, i) => items.push({ descripcion: d, categoria: 'COMERCIAL', orden: i }));
    riesgos.forEach((d, i) => items.push({ descripcion: d, categoria: 'RIESGOS', orden: comercial.length + i }));
  } else if (bloque === 5) {
    const riesgos = [
      'Recepción del avalúo final',
      'Reporte cualitativo del Área de Crédito',
      'Determinación del aforo de garantías definitivo — Comité de Crédito',
      'Ratificación del monto del crédito — Comité de Crédito',
      'Carga del crédito en sistema',
      'Dispersión del crédito realizada',
    ];
    const juridico = [
      'Elaboración del contrato de crédito',
      producto === 'STPB' ? 'Elaboración de la escritura de fideicomiso de garantía' : 'Revisión de garantías',
      producto === 'STPB' ? 'Elaboración de convenios de participación por inversionista' : 'Documentación complementaria',
      'Programación de fecha de firma',
      'Firma realizada',
    ];
    riesgos.forEach((d, i) => items.push({ descripcion: d, categoria: 'RIESGOS', orden: i }));
    juridico.forEach((d, i) => items.push({ descripcion: d, categoria: 'JURIDICO', orden: riesgos.length + i }));
  }
  return items;
}

export default router;
