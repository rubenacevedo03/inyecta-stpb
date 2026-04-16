import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.usuario.upsert({
    where: { email: 'ruben.acevedo03@inyecta.com.mx' },
    update: {},
    create: {
      nombre: 'Rubén Acevedo',
      email: 'ruben.acevedo03@inyecta.com.mx',
      password: adminPassword,
      rol: 'ADMIN',
    },
  });
  console.log('Admin created:', admin.email);

  const juridico = await prisma.usuario.upsert({
    where: { email: 'juridico@inyecta.com.mx' },
    update: {},
    create: {
      nombre: 'Legal Inyecta',
      email: 'juridico@inyecta.com.mx',
      password: await bcrypt.hash('legal123', 12),
      rol: 'LEGAL',
    },
  });

  const operador = await prisma.usuario.upsert({
    where: { email: 'operador@inyecta.com.mx' },
    update: {},
    create: {
      nombre: 'Operador Demo',
      email: 'operador@inyecta.com.mx',
      password: await bcrypt.hash('operador123', 12),
      rol: 'OPERADOR',
    },
  });
  console.log('Usuarios adicionales creados:', juridico.email, operador.email);

  // ── Operación de muestra (STPB) ───────────────────────────────────────────
  const existing = await prisma.operacion.findFirst({ where: { folio: 'INY-SEED-001' } });
  if (!existing) {
    const monto = 3_500_000;
    const tasaAnual = 0.18;
    const plazoMeses = 36;
    // Use local-time constructor to avoid UTC midnight → day-before timezone shift
    const fechaPrimerPago = new Date(2026, 5, 1, 12, 0, 0); // June 1 2026 at noon local

    // French amortization with safe month addition (no overflow)
    const r = tasaAnual / 12;
    const factor = Math.pow(1 + r, plazoMeses);
    const PMT = (monto * r * factor) / (factor - 1);
    const pagos: {
      numeroPago: number; fechaVencimiento: Date;
      capitalTotal: number; interesTotal: number; pagoTotal: number; saldo: number;
    }[] = [];
    let saldo = monto;
    for (let i = 1; i <= plazoMeses; i++) {
      const interes = saldo * r;
      const capital = PMT - interes;
      saldo = Math.max(0, saldo - capital);
      // Safe month add: clamp day to last day of target month
      const baseDay = fechaPrimerPago.getDate();
      const totalMonths = fechaPrimerPago.getMonth() + (i - 1);
      const yr = fechaPrimerPago.getFullYear() + Math.floor(totalMonths / 12);
      const mo = ((totalMonths % 12) + 12) % 12;
      const maxDay = new Date(yr, mo + 1, 0).getDate();
      const fecha = new Date(yr, mo, Math.min(baseDay, maxDay), 12, 0, 0);
      pagos.push({
        numeroPago: i,
        fechaVencimiento: fecha,
        capitalTotal: Math.round(capital * 100) / 100,
        interesTotal: Math.round(interes * 100) / 100,
        pagoTotal: Math.round(PMT * 100) / 100,
        saldo: Math.round(saldo * 100) / 100,
      });
    }

    const op = await prisma.operacion.create({
      data: {
        folio: 'INY-SEED-001',
        nombre: 'Crédito Hipotecario STPB — Desarrollos del Centro',
        producto: 'STPB',
        status: 'ANALISIS',
        bloqueActual: 2,
        acreditadoNombre: 'Desarrollos Inmobiliarios del Centro S.A.',
        acreditadoRfc: 'DIC200101ABC',
        acreditadoTipo: 'PM',
        acreditadoTelefono: '444-123-4567',
        acreditadoEmail: 'contacto@dicsa.mx',
        acreditadoDireccion: 'Av. Carranza 1500, Col. Centro, SLP',
        ejecutivoId: operador.id,
        creadoPorId: admin.id,
        monto,
        tasaAnual,
        plazoMeses,
        fechaPrimerPago,
        comisionApertura: 0.03,
        costosFijos: 0,
        spreadSofom: 0.04,
        adminFideicomiso: 0.015,
        comisionCobranza: 0.005,
        sofomComoAcreditante: true,
        sofomMonto: 500_000,
        sofomTasaNeta: 0.14,
        valorInmueble: 5_800_000,
        ltv: monto / 5_800_000,
        notas: 'Operación de muestra generada por seed',
        inversionistas: {
          create: [
            {
              nombre: 'Grupo Financiero Lomas S.A.',
              monto: 1_750_000,
              porcentaje: 0.50,
              tasaNeta: 0.14,
              orden: 0,
              esSofom: false,
            },
            {
              nombre: 'Inversiones Sierra Vista S.C.',
              monto: 1_250_000,
              porcentaje: 0.3571,
              tasaNeta: 0.13,
              orden: 1,
              esSofom: false,
            },
            {
              nombre: 'SOFOM Inyecta (participación propia)',
              monto: 500_000,
              porcentaje: 0.1429,
              tasaNeta: 0.14,
              orden: 2,
              esSofom: true,
            },
          ],
        },
        bloques: {
          create: [
            {
              numeroBloque: 1,
              status: 'CERRADO',
              resultado: 'PRE_AUTORIZADO',
              slaHoras: 72,
              fechaInicio: new Date('2026-04-01'),
              fechaCierre: new Date('2026-04-03'),
              checklistItems: {
                create: [
                  { descripcion: 'Análisis de buró de crédito — carga financiera', categoria: 'RIESGOS', orden: 0, completado: true },
                  { descripcion: 'Análisis de estados financieros — estructura de la empresa', categoria: 'RIESGOS', orden: 1, completado: true },
                  { descripcion: 'Comportamiento del ingreso bancario (estado de cuenta depurado)', categoria: 'RIESGOS', orden: 2, completado: true },
                  { descripcion: 'Coherencia fiscal vs. ingresos', categoria: 'RIESGOS', orden: 3, completado: true },
                  { descripcion: 'Análisis integral de capacidad de pago vs. carga financiera', categoria: 'RIESGOS', orden: 4, completado: true },
                  { descripcion: 'Viabilidad preliminar de garantía', categoria: 'RIESGOS', orden: 5, completado: true },
                  { descripcion: 'Perfil de la operación (estructura, avales, condiciones)', categoria: 'RIESGOS', orden: 6, completado: true },
                ],
              },
            },
            {
              numeroBloque: 2,
              status: 'EN_PROCESO',
              slaHoras: null,
              fechaInicio: new Date('2026-04-04'),
              checklistItems: {
                create: [
                  { descripcion: 'Integración documental completa', categoria: 'COMERCIAL', orden: 0, completado: true },
                  { descripcion: 'Validación de documentos (cotejo)', categoria: 'COMERCIAL', orden: 1, completado: false },
                  { descripcion: 'Sellos y firmas de cotejo en el expediente', categoria: 'COMERCIAL', orden: 2, completado: false },
                  { descripcion: 'Verificación de domicilio', categoria: 'COMERCIAL', orden: 3, completado: false },
                  { descripcion: 'Solicitud CLG ante RPP o solicitud directa al cliente', categoria: 'COMERCIAL', orden: 4, completado: false },
                ],
              },
            },
            {
              numeroBloque: 3,
              status: 'PENDIENTE',
              slaHoras: 72,
              checklistItems: {
                create: [
                  { descripcion: 'Validación societaria (SIGER) — PM', categoria: 'JURIDICO', orden: 0, completado: false },
                  { descripcion: 'Dictamen corporativo', categoria: 'JURIDICO', orden: 1, completado: false },
                  { descripcion: 'Consultas legales de intervinientes (PF y PM)', categoria: 'JURIDICO', orden: 2, completado: false },
                  { descripcion: 'Dictamen de garantías — inmueble / prenda', categoria: 'JURIDICO', orden: 3, completado: false },
                  { descripcion: 'Validación CLG (garantías hipotecarias) o RUG + sellos (prendarias)', categoria: 'JURIDICO', orden: 4, completado: false },
                  { descripcion: 'Validación de garantes', categoria: 'JURIDICO', orden: 5, completado: false },
                  { descripcion: 'Validación de avales', categoria: 'JURIDICO', orden: 6, completado: false },
                ],
              },
            },
            {
              numeroBloque: 4,
              status: 'PENDIENTE',
              checklistItems: {
                create: [
                  { descripcion: 'Entrega de solicitud', categoria: 'COMERCIAL', orden: 0, completado: false },
                  { descripcion: 'Entrega de reporte de visita', categoria: 'COMERCIAL', orden: 1, completado: false },
                  { descripcion: 'Entrega de reporte cualitativo del Área Comercial', categoria: 'COMERCIAL', orden: 2, completado: false },
                  { descripcion: 'Revisión final del expediente debidamente integrado', categoria: 'RIESGOS', orden: 3, completado: false },
                  { descripcion: 'Solicitud de avalúo', categoria: 'RIESGOS', orden: 4, completado: false },
                ],
              },
            },
            {
              numeroBloque: 5,
              status: 'PENDIENTE',
              checklistItems: {
                create: [
                  { descripcion: 'Recepción del avalúo final', categoria: 'RIESGOS', orden: 0, completado: false },
                  { descripcion: 'Reporte cualitativo del Área de Crédito', categoria: 'RIESGOS', orden: 1, completado: false },
                  { descripcion: 'Determinación del aforo de garantías definitivo — Comité de Crédito', categoria: 'RIESGOS', orden: 2, completado: false },
                  { descripcion: 'Ratificación del monto del crédito — Comité de Crédito', categoria: 'RIESGOS', orden: 3, completado: false },
                  { descripcion: 'Carga del crédito en sistema', categoria: 'RIESGOS', orden: 4, completado: false },
                  { descripcion: 'Dispersión del crédito realizada', categoria: 'RIESGOS', orden: 5, completado: false },
                  { descripcion: 'Elaboración del contrato de crédito', categoria: 'JURIDICO', orden: 6, completado: false },
                  { descripcion: 'Elaboración de la escritura de fideicomiso de garantía', categoria: 'JURIDICO', orden: 7, completado: false },
                  { descripcion: 'Elaboración de convenios de participación por inversionista', categoria: 'JURIDICO', orden: 8, completado: false },
                  { descripcion: 'Programación de fecha de firma', categoria: 'JURIDICO', orden: 9, completado: false },
                  { descripcion: 'Firma realizada', categoria: 'JURIDICO', orden: 10, completado: false },
                ],
              },
            },
          ],
        },
      },
    });

    // Create payment schedule
    await prisma.pagoMensual.createMany({ data: pagos.map(p => ({ ...p, operacionId: op.id })) });

    // Seed history
    await prisma.historialMovimiento.createMany({
      data: [
        {
          operacionId: op.id,
          usuarioId: admin.id,
          tipo: 'CREACION',
          descripcion: 'Operación INY-SEED-001 creada',
          detalle: 'Producto: STPB | Monto: $3,500,000 | Plazo: 36 meses',
          creadoEn: new Date('2026-04-01T09:00:00'),
        },
        {
          operacionId: op.id,
          usuarioId: operador.id,
          tipo: 'AVANCE_BLOQUE',
          descripcion: 'Avance de Bloque 1 → Bloque 2',
          creadoEn: new Date('2026-04-03T17:30:00'),
        },
      ],
    });

    console.log('Operación de muestra creada:', op.folio);
  } else {
    console.log('Operación de muestra ya existente, omitiendo.');
  }

  console.log('Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
