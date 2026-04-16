import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { calcularAmortFrances } from '@inyecta/core';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ─── Includes reutilizables ───────────────────────────────────────────────────

const includeBasica = {
  acreditado:   true,
  ejecutivo:    { select: { id: true, nombre: true } },
  participaciones: {
    include: { inversionista: true },
    orderBy: { orden: 'asc' as const },
  },
  bloques:      { orderBy: { numeroBloque: 'asc' as const } },
  _count:       { select: { pagos: true, solicitudes: true } },
};

const includeCompleta = {
  acreditado:   true,
  ejecutivo:    { select: { id: true, nombre: true, email: true } },
  creadoPor:    { select: { id: true, nombre: true } },
  participaciones: {
    include: { inversionista: true },
    orderBy: { orden: 'asc' as const },
  },
  bloques: {
    include: { checklistItems: { orderBy: { orden: 'asc' as const } } },
    orderBy: { numeroBloque: 'asc' as const },
  },
  pagos:        { orderBy: { numeroPago: 'asc' as const } },
  documentos:   { orderBy: { creadoEn:   'asc' as const } },
  solicitudes: {
    include: {
      generadaPor: { select: { nombre: true } },
      dirigidaA:   { select: { nombre: true } },
    },
    orderBy: { creadoEn: 'desc' as const },
  },
  historial: {
    include: { usuario: { select: { nombre: true, rol: true } } },
    orderBy: { creadoEn: 'asc' as const },
  },
};

// ─── GET /api/operaciones ─────────────────────────────────────────────────────

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, producto } = req.query;
    const where: any = {};
    if (status)   where.status   = status;
    if (producto) where.producto = producto;

    const ops = await prisma.operacion.findMany({
      where,
      include: includeBasica,
      orderBy: { creadoEn: 'desc' },
    });
    res.json(ops);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/operaciones/:id ─────────────────────────────────────────────────

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const op = await prisma.operacion.findUnique({
      where:   { id: req.params.id as string },
      include: includeCompleta,
    });
    if (!op) { res.status(404).json({ error: 'Operación no encontrada' }); return; }
    res.json(op);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/operaciones ────────────────────────────────────────────────────

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      nombre, producto,
      // Acreditado — acepta FK directa O campos inline (compat v1)
      acreditadoId: acreditadoIdParam,
      acreditadoNombre, acreditadoRfc,
      acreditadoTipo, acreditadoTelefono, acreditadoEmail, acreditadoDireccion,
      // Usuarios
      ejecutivoId,
      // Parámetros financieros
      monto, tasaAnual, plazoMeses, fechaPrimerPago,
      comisionApertura, costosFijos,
      // IVA / mora
      aplicaIva, tasaIva, tasaMoratoriaAnual, diasGracia, capitalizaMoratorios,
      // STPB
      spreadSofom, adminFideicomiso, comisionCobranza,
      sofomComoAcreditante, sofomMonto, sofomTasaNeta,
      // Extras
      valorInmueble, notas, folioPld,
    } = req.body;

    // ── Resolver acreditadoId ──────────────────────────────────────────────────
    let acreditadoId = acreditadoIdParam as string | undefined;

    if (!acreditadoId) {
      // Compat v1: crear / recuperar acreditado a partir de campos inline
      if (!acreditadoNombre) {
        res.status(400).json({ error: 'acreditadoId o acreditadoNombre es requerido' });
        return;
      }
      // Buscar por RFC si se proporcionó
      let acreditado = acreditadoRfc
        ? await prisma.acreditado.findFirst({ where: { rfc: acreditadoRfc } })
        : null;

      if (!acreditado) {
        acreditado = await prisma.acreditado.create({
          data: {
            nombre:     acreditadoNombre,
            rfc:        acreditadoRfc       || null,
            telefono:   acreditadoTelefono  || null,
            email:      acreditadoEmail     || null,
            direccion:  acreditadoDireccion || null,
            tipoPersona: acreditadoTipo     || 'PF',
          },
        });
      }
      acreditadoId = acreditado.id;
    }

    // ── Generar folio ──────────────────────────────────────────────────────────
    const now   = new Date();
    const yy    = now.getFullYear().toString().slice(-2);
    const mm    = (now.getMonth() + 1).toString().padStart(2, '0');
    const rand  = Math.random().toString(36).substring(2, 6).toUpperCase();
    const folio = `INY-${yy}${mm}-${rand}`;

    const ltv   = valorInmueble && monto ? monto / valorInmueble : null;

    // ── Crear la operación con sus bloques ─────────────────────────────────────
    const op = await prisma.operacion.create({
      data: {
        folio,
        nombre,
        producto,
        status:       'PROSPECTO',
        acreditadoId,
        ejecutivoId:  ejecutivoId || (req as any).user!.id,
        creadoPorId:  (req as any).user!.id,

        monto,
        tasaAnual,
        plazoMeses,
        fechaPrimerPago:   new Date(fechaPrimerPago),
        comisionApertura:  comisionApertura  ?? 0.03,
        costosFijos:       costosFijos       ?? 0,

        aplicaIva:            aplicaIva           ?? true,
        tasaIva:              tasaIva             ?? 0.16,
        tasaMoratoriaAnual:   tasaMoratoriaAnual  ?? 0,
        diasGracia:           diasGracia          ?? 3,
        capitalizaMoratorios: capitalizaMoratorios ?? false,

        spreadSofom, adminFideicomiso, comisionCobranza,
        sofomComoAcreditante: sofomComoAcreditante ?? false,
        sofomMonto, sofomTasaNeta,

        valorInmueble, ltv, notas, folioPld,

        bloques: {
          create: [1, 2, 3, 4, 5].map(num => ({
            numeroBloque: num,
            status:   num === 1 ? 'EN_PROCESO' : 'PENDIENTE',
            slaHoras: [1, 3].includes(num) ? 72 : null,
            checklistItems: {
              create: getChecklistItems(num, producto),
            },
          })),
        },
      },
      include: {
        acreditado: true,
        bloques: { include: { checklistItems: true } },
        participaciones: true,
      },
    });

    // ── Generar tabla de amortización ──────────────────────────────────────────
    const amort   = calcularAmortFrances(monto, tasaAnual, plazoMeses, new Date(fechaPrimerPago));
    const ivaTasa = (aplicaIva ?? true) ? (tasaIva ?? 0.16) : 0;

    await prisma.pagoMensual.createMany({
      data: amort.filas.map((fila: any) => {
        const ivaImporte = Math.round(fila.pagoIntereses * ivaTasa * 100) / 100;
        return {
          operacionId:   op.id,
          numeroPago:    fila.mes,
          fechaVencimiento: fila.fecha,
          capitalTotal:  fila.pagoCapital,
          interesTotal:  fila.pagoIntereses,
          iva:           ivaImporte,
          pagoTotal:     Math.round((fila.pagoTotal + ivaImporte) * 100) / 100,
          saldo:         fila.saldo,
        };
      }),
    });

    // ── Historial de creación ──────────────────────────────────────────────────
    await prisma.historialMovimiento.create({
      data: {
        operacionId: op.id,
        usuarioId:   (req as any).user!.id,
        tipo:        'CREACION',
        descripcion: `Operación ${folio} creada`,
        detalle:     `Producto: ${producto} | Monto: $${Number(monto).toLocaleString('es-MX')} | Plazo: ${plazoMeses} meses`,
      },
    });

    res.status(201).json(op);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── PATCH /api/operaciones/:id/status ───────────────────────────────────────

router.patch('/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, motivo } = req.body;
    const op = await prisma.operacion.update({
      where: { id: req.params.id as string },
      data:  { status },
    });
    await prisma.historialMovimiento.create({
      data: {
        operacionId: op.id,
        usuarioId:   (req as any).user!.id,
        tipo:        'CAMBIO_ESTATUS',
        descripcion: `Estatus cambiado a ${status}`,
        detalle:     motivo || null,
      },
    });
    res.json(op);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── PATCH /api/operaciones/:id — actualizar campos generales ─────────────────

router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      nombre, ejecutivoId, monto, tasaAnual, plazoMeses, fechaPrimerPago,
      comisionApertura, costosFijos, notas, folioPld, valorInmueble,
      aplicaIva, tasaIva, tasaMoratoriaAnual, diasGracia, capitalizaMoratorios,
      spreadSofom, adminFideicomiso, comisionCobranza,
      sofomComoAcreditante, sofomMonto, sofomTasaNeta,
    } = req.body;

    const ltv = valorInmueble !== undefined && monto !== undefined
      ? (valorInmueble && monto ? monto / valorInmueble : null)
      : undefined;

    const op = await prisma.operacion.update({
      where: { id: req.params.id as string },
      data: {
        ...(nombre               !== undefined && { nombre }),
        ...(ejecutivoId          !== undefined && { ejecutivoId }),
        ...(monto                !== undefined && { monto }),
        ...(tasaAnual            !== undefined && { tasaAnual }),
        ...(plazoMeses           !== undefined && { plazoMeses }),
        ...(fechaPrimerPago      !== undefined && { fechaPrimerPago: new Date(fechaPrimerPago) }),
        ...(comisionApertura     !== undefined && { comisionApertura }),
        ...(costosFijos          !== undefined && { costosFijos }),
        ...(notas                !== undefined && { notas }),
        ...(folioPld             !== undefined && { folioPld }),
        ...(valorInmueble        !== undefined && { valorInmueble }),
        ...(ltv                  !== undefined && { ltv }),
        ...(aplicaIva            !== undefined && { aplicaIva }),
        ...(tasaIva              !== undefined && { tasaIva }),
        ...(tasaMoratoriaAnual   !== undefined && { tasaMoratoriaAnual }),
        ...(diasGracia           !== undefined && { diasGracia }),
        ...(capitalizaMoratorios !== undefined && { capitalizaMoratorios }),
        ...(spreadSofom          !== undefined && { spreadSofom }),
        ...(adminFideicomiso     !== undefined && { adminFideicomiso }),
        ...(comisionCobranza     !== undefined && { comisionCobranza }),
        ...(sofomComoAcreditante !== undefined && { sofomComoAcreditante }),
        ...(sofomMonto           !== undefined && { sofomMonto }),
        ...(sofomTasaNeta        !== undefined && { sofomTasaNeta }),
      },
    });
    res.json(op);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/operaciones/:id/corrida ─────────────────────────────────────────

router.get('/:id/corrida', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { tipo, inversionistaId } = req.query as {
      tipo: string;
      inversionistaId?: string;
    };

    const op = await prisma.operacion.findUnique({
      where:   { id: req.params.id as string },
      include: {
        acreditado:      true,
        participaciones: { include: { inversionista: true } },
      },
    });
    if (!op) { res.status(404).json({ error: 'Operación no encontrada' }); return; }

    const montoNum    = Number(op.monto);
    const tasaNum     = Number(op.tasaAnual);
    const meses       = op.plazoMeses;
    const fechaPago   = op.fechaPrimerPago;
    const comApertura = Number(op.comisionApertura);

    if (tipo === 'acreditado') {
      const amort = calcularAmortFrances(montoNum, tasaNum, meses, fechaPago);
      res.json({
        amort,
        nombre:    op.acreditado.nombre,
        operacion: op,
        comisionApertura:     montoNum * comApertura,
        comisionAperturaPorc: comApertura,
      });

    } else if (tipo === 'inversionista' && inversionistaId) {
      const part = op.participaciones.find(
        p => p.inversionistaId === inversionistaId,
      );
      if (!part) { res.status(404).json({ error: 'Participación no encontrada' }); return; }

      const montoInv = Number(part.montoAportado);
      const tasaInv  = Number(part.tasaNeta);
      const amort    = calcularAmortFrances(montoInv, tasaInv, meses, fechaPago);
      res.json({
        amort,
        nombre:               part.inversionista.nombre,
        participacion:        Number(part.porcentajeParticipacion),
        operacion:            op,
        comisionApertura:     0,
        comisionAperturaPorc: 0,
      });

    } else {
      res.status(400).json({ error: 'tipo requerido (acreditado | inversionista)' });
    }
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Helper: checklist items por bloque y producto ───────────────────────────

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
      producto === 'STPB'
        ? 'Elaboración de la escritura de fideicomiso de garantía'
        : 'Revisión de garantías',
      producto === 'STPB'
        ? 'Elaboración de convenios de participación por inversionista'
        : 'Documentación complementaria',
      'Programación de fecha de firma',
      'Firma realizada',
    ];
    riesgos.forEach((d, i) => items.push({ descripcion: d, categoria: 'RIESGOS', orden: i }));
    juridico.forEach((d, i) => items.push({ descripcion: d, categoria: 'JURIDICO', orden: riesgos.length + i }));
  }

  return items;
}

export default router;
