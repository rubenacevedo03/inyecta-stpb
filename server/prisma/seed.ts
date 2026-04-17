/**
 * seed.ts — Schema v2
 *
 * Crea:
 *   • 3 usuarios (admin, legal, operador)
 *   • 3 inversionistas catálogo
 *   • 2 acreditados catálogo
 *   • 2 operaciones con participaciones, bloques, pagos e historial
 */

import { PrismaClient, StatusPago } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calcularAmortFrances } from '@inyecta/core';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed (schema v2)...');

  // ── Usuarios ──────────────────────────────────────────────────────────────

  const admin = await prisma.usuario.upsert({
    where:  { email: 'ruben.acevedo@inyecta.com.mx' },
    update: {},
    create: {
      nombre:   'Rubén Acevedo',
      email:    'ruben.acevedo@inyecta.com.mx',
      password: await bcrypt.hash('Admin123!', 12),
      rol:      'ADMIN',
    },
  });

  const legal = await prisma.usuario.upsert({
    where:  { email: 'juridico@inyecta.com.mx' },
    update: {},
    create: {
      nombre:   'Legal Inyecta',
      email:    'juridico@inyecta.com.mx',
      password: await bcrypt.hash('Legal123!', 12),
      rol:      'LEGAL',
    },
  });

  const operador = await prisma.usuario.upsert({
    where:  { email: 'operador@inyecta.com.mx' },
    update: {},
    create: {
      nombre:   'Operador Demo',
      email:    'operador@inyecta.com.mx',
      password: await bcrypt.hash('Oper123!', 12),
      rol:      'OPERADOR',
    },
  });

  console.log('✓ Usuarios:', admin.email, legal.email, operador.email);

  // ── Inversionistas catálogo ───────────────────────────────────────────────

  const invLomas = await prisma.inversionista.upsert({
    where:  { cuentaClabe: '014320650000000001' },
    update: {},
    create: {
      nombre:      'Grupo Financiero Lomas S.A.',
      rfc:         'GFL200101ABC',
      banco:       'Santander',
      cuentaClabe: '014320650000000001',
      email:       'contacto@gflomas.com',
      telefono:    '444-100-2000',
    },
  });

  const invSierra = await prisma.inversionista.upsert({
    where:  { cuentaClabe: '021000026600360000' },
    update: {},
    create: {
      nombre:      'Inversiones Sierra Vista S.C.',
      rfc:         'ISV150605XYZ',
      banco:       'HSBC',
      cuentaClabe: '021000026600360000',
      email:       'inversiones@sierravista.mx',
      telefono:    '444-200-3000',
    },
  });

  const invSofom = await prisma.inversionista.upsert({
    where:  { cuentaClabe: '706180655380540001' },
    update: {},
    create: {
      nombre:      'SOFOM Inyecta (participación propia)',
      rfc:         'INY200301SOF',
      banco:       'STP',
      cuentaClabe: '706180655380540001',
      email:       'inversion@inyecta.com.mx',
      telefono:    '444-100-0000',
    },
  });

  console.log('✓ Inversionistas catálogo:', invLomas.nombre, invSierra.nombre, invSofom.nombre);

  // ── Acreditados catálogo ──────────────────────────────────────────────────

  const acredEmpresa = await prisma.acreditado.upsert({
    where:  { id: 'seed-acreditado-001' },
    update: {},
    create: {
      id:         'seed-acreditado-001',
      nombre:     'Desarrollos Inmobiliarios del Centro S.A.',
      rfc:        'DIC200101ABC',
      tipoPersona: 'PM',
      telefono:   '444-123-4567',
      email:      'contacto@dicsa.mx',
      direccion:  'Av. Carranza 1500, Col. Centro, SLP',
    },
  });

  const acredPF = await prisma.acreditado.upsert({
    where:  { id: 'seed-acreditado-002' },
    update: {},
    create: {
      id:         'seed-acreditado-002',
      nombre:     'María García Hernández',
      rfc:        'GAHM850315ABC',
      tipoPersona: 'PF',
      telefono:   '444-987-6543',
      email:      'maria.garcia@gmail.com',
      direccion:  'Calle Pinos 45, Col. Las Palmas, SLP',
    },
  });

  console.log('✓ Acreditados catálogo:', acredEmpresa.nombre, acredPF.nombre);

  // ── Operación 1: STPB — Desarrollos del Centro ────────────────────────────

  const existeOp1 = await prisma.operacion.findFirst({ where: { folio: 'INY-SEED-001' } });
  if (!existeOp1) {
    const monto1       = 3_500_000;
    const tasaAnual1   = 0.18;
    const plazoMeses1  = 36;
    const tasaMora1    = 0.36;
    const tasaIva1     = 0.16;
    const fechaPago1   = new Date(2026, 5, 1, 12, 0, 0); // 1-jun-2026 mediodía local

    const amort1 = calcularAmortFrances(monto1, tasaAnual1, plazoMeses1, fechaPago1);

    const op1 = await prisma.operacion.create({
      data: {
        folio:        'INY-SEED-001',
        nombre:       'Crédito Hipotecario STPB — Desarrollos del Centro',
        producto:     'STPB',
        status:       'ANALISIS',
        bloqueActual: 2,
        acreditadoId: acredEmpresa.id,
        ejecutivoId:  operador.id,
        creadoPorId:  admin.id,

        monto:              monto1,
        tasaAnual:          tasaAnual1,
        plazoMeses:         plazoMeses1,
        fechaPrimerPago:    fechaPago1,
        comisionApertura:   0.03,
        costosFijos:        0,

        aplicaIva:            true,
        tasaIva:              tasaIva1,
        tasaMoratoriaAnual:   tasaMora1,
        diasGracia:           3,
        capitalizaMoratorios: false,

        spreadSofom:         0.04,
        adminFideicomiso:    0.015,
        comisionCobranza:    0.005,
        sofomComoAcreditante: true,
        sofomMonto:          500_000,
        sofomTasaNeta:       0.14,

        valorInmueble: 5_800_000,
        ltv:           monto1 / 5_800_000,
        notas:         'Operación de muestra generada por seed',

        bloques: {
          create: [
            {
              numeroBloque: 1,
              status:       'CERRADO',
              resultado:    'PRE_AUTORIZADO',
              slaHoras:     72,
              fechaInicio:  new Date('2026-04-01'),
              fechaCierre:  new Date('2026-04-03'),
              checklistItems: {
                create: [
                  { descripcion: 'Análisis de buró de crédito — carga financiera',             categoria: 'RIESGOS', orden: 0, completado: true },
                  { descripcion: 'Análisis de estados financieros — estructura de la empresa', categoria: 'RIESGOS', orden: 1, completado: true },
                  { descripcion: 'Comportamiento del ingreso bancario (estado de cuenta depurado)', categoria: 'RIESGOS', orden: 2, completado: true },
                  { descripcion: 'Coherencia fiscal vs. ingresos',                             categoria: 'RIESGOS', orden: 3, completado: true },
                  { descripcion: 'Análisis integral de capacidad de pago vs. carga financiera', categoria: 'RIESGOS', orden: 4, completado: true },
                  { descripcion: 'Viabilidad preliminar de garantía',                          categoria: 'RIESGOS', orden: 5, completado: true },
                  { descripcion: 'Perfil de la operación (estructura, avales, condiciones)',   categoria: 'RIESGOS', orden: 6, completado: true },
                  { descripcion: 'Sellos y certificados digitales',                            categoria: 'RIESGOS', orden: 7, completado: true },
                ],
              },
            },
            {
              numeroBloque: 2,
              status:       'EN_PROCESO',
              slaHoras:     null,
              fechaInicio:  new Date('2026-04-04'),
              checklistItems: {
                create: [
                  { descripcion: 'Integración documental completa',                  categoria: 'COMERCIAL', orden: 0, completado: true },
                  { descripcion: 'Validación de documentos (cotejo)',                 categoria: 'COMERCIAL', orden: 1, completado: false },
                  { descripcion: 'Sellos y firmas de cotejo en el expediente',        categoria: 'COMERCIAL', orden: 2, completado: false },
                  { descripcion: 'Visita ocular al negocio',                          categoria: 'COMERCIAL', orden: 3, completado: false },
                  { descripcion: 'Solicitud CLG ante RPP o solicitud directa al cliente', categoria: 'COMERCIAL', orden: 4, completado: false },
                ],
              },
            },
            {
              numeroBloque: 3, status: 'PENDIENTE', slaHoras: 72,
              checklistItems: { create: [
                { descripcion: 'Validación societaria (SIGER) — PM',                                      categoria: 'JURIDICO', orden: 0, completado: false },
                { descripcion: 'Dictamen corporativo',                                                     categoria: 'JURIDICO', orden: 1, completado: false },
                { descripcion: 'Consultas legales de intervinientes (PF y PM)',                            categoria: 'JURIDICO', orden: 2, completado: false },
                { descripcion: 'Dictamen de garantías — inmueble / prenda',                                categoria: 'JURIDICO', orden: 3, completado: false },
                { descripcion: 'Validación CLG (garantías hipotecarias) o RUG + sellos (prendarias)',      categoria: 'JURIDICO', orden: 4, completado: false },
                { descripcion: 'Validación de garantes',                                                   categoria: 'JURIDICO', orden: 5, completado: false },
                { descripcion: 'Validación de avales',                                                     categoria: 'JURIDICO', orden: 6, completado: false },
              ]},
            },
            {
              numeroBloque: 4, status: 'PENDIENTE',
              checklistItems: { create: [
                { descripcion: 'Entrega de solicitud',                                    categoria: 'COMERCIAL', orden: 0, completado: false },
                { descripcion: 'Entrega de reporte de visita',                            categoria: 'COMERCIAL', orden: 1, completado: false },
                { descripcion: 'Entrega de reporte cualitativo del Área Comercial',       categoria: 'COMERCIAL', orden: 2, completado: false },
                { descripcion: 'Revisión final del expediente debidamente integrado',     categoria: 'RIESGOS',   orden: 3, completado: false },
                { descripcion: 'Solicitud de avalúo',                                     categoria: 'RIESGOS',   orden: 4, completado: false },
              ]},
            },
            {
              numeroBloque: 5, status: 'PENDIENTE',
              checklistItems: { create: [
                { descripcion: 'Recepción del avalúo final',                                          categoria: 'RIESGOS',   orden: 0,  completado: false },
                { descripcion: 'Reporte cualitativo del Área de Crédito',                             categoria: 'RIESGOS',   orden: 1,  completado: false },
                { descripcion: 'Determinación del aforo de garantías definitivo — Comité de Crédito', categoria: 'RIESGOS',   orden: 2,  completado: false },
                { descripcion: 'Ratificación del monto del crédito — Comité de Crédito',              categoria: 'RIESGOS',   orden: 3,  completado: false },
                { descripcion: 'Carga del crédito en sistema',                                        categoria: 'RIESGOS',   orden: 4,  completado: false },
                { descripcion: 'Dispersión del crédito realizada',                                    categoria: 'RIESGOS',   orden: 5,  completado: false },
                { descripcion: 'Elaboración del contrato de crédito',                                 categoria: 'JURIDICO',  orden: 6,  completado: false },
                { descripcion: 'Elaboración de la escritura de fideicomiso de garantía',              categoria: 'JURIDICO',  orden: 7,  completado: false },
                { descripcion: 'Elaboración de convenios de participación por inversionista',         categoria: 'JURIDICO',  orden: 8,  completado: false },
                { descripcion: 'Programación de fecha de firma',                                      categoria: 'JURIDICO',  orden: 9,  completado: false },
                { descripcion: 'Firma realizada',                                                     categoria: 'JURIDICO',  orden: 10, completado: false },
              ]},
            },
          ],
        },
      },
    });

    // Participaciones (Lomas 50% + Sierra 35.71% + Sofom 14.29%)
    await prisma.participacion.createMany({
      data: [
        { operacionId: op1.id, inversionistaId: invLomas.id,  porcentajeParticipacion: 0.50,   montoAportado: 1_750_000, tasaNeta: 0.14, esSofom: false, orden: 0 },
        { operacionId: op1.id, inversionistaId: invSierra.id, porcentajeParticipacion: 0.3571, montoAportado: 1_250_000, tasaNeta: 0.13, esSofom: false, orden: 1 },
        { operacionId: op1.id, inversionistaId: invSofom.id,  porcentajeParticipacion: 0.1429, montoAportado: 500_000,   tasaNeta: 0.14, esSofom: true,  orden: 2 },
      ],
    });

    // Tabla de amortización con IVA
    await prisma.pagoMensual.createMany({
      data: amort1.filas.map(fila => {
        const ivaImporte = Math.round(fila.pagoIntereses * tasaIva1 * 100) / 100;
        return {
          operacionId:      op1.id,
          numeroPago:       fila.mes,
          fechaVencimiento: fila.fecha,
          capitalTotal:     fila.pagoCapital,
          interesTotal:     fila.pagoIntereses,
          iva:              ivaImporte,
          pagoTotal:        Math.round((fila.pagoTotal + ivaImporte) * 100) / 100,
          saldo:            fila.saldo,
        };
      }),
    });

    // Historial
    await prisma.historialMovimiento.createMany({
      data: [
        {
          operacionId: op1.id, usuarioId: admin.id,
          tipo: 'CREACION', descripcion: 'Operación INY-SEED-001 creada',
          detalle: 'Producto: STPB | Monto: $3,500,000 | Plazo: 36 meses',
          creadoEn: new Date('2026-04-01T09:00:00'),
        },
        {
          operacionId: op1.id, usuarioId: operador.id,
          tipo: 'AVANCE_BLOQUE', descripcion: 'Avance Bloque 1 → Bloque 2',
          creadoEn: new Date('2026-04-03T17:30:00'),
        },
      ],
    });

    console.log('✓ Operación 1 creada:', op1.folio, '| PMT acreditado:', amort1.pmt);
  } else {
    console.log('— Operación 1 ya existe, omitiendo.');
  }

  // ── Operación 2: PERSONAL — María García ─────────────────────────────────

  const existeOp2 = await prisma.operacion.findFirst({ where: { folio: 'INY-SEED-002' } });
  if (!existeOp2) {
    const monto2      = 800_000;
    const tasaAnual2  = 0.20;
    const plazoMeses2 = 24;
    const tasaMora2   = 0.40;
    const tasaIva2    = 0.16;
    const fechaPago2  = new Date(2025, 3, 1, 12, 0, 0); // 1-abr-2025 mediodía local

    const amort2 = calcularAmortFrances(monto2, tasaAnual2, plazoMeses2, fechaPago2);

    const op2 = await prisma.operacion.create({
      data: {
        folio:        'INY-SEED-002',
        nombre:       'Crédito Personal — María García Hernández',
        producto:     'PERSONAL',
        status:       'ACTIVA',
        bloqueActual: 5,
        acreditadoId: acredPF.id,
        ejecutivoId:  operador.id,
        creadoPorId:  admin.id,

        monto:              monto2,
        tasaAnual:          tasaAnual2,
        plazoMeses:         plazoMeses2,
        fechaPrimerPago:    fechaPago2,
        comisionApertura:   0.02,
        costosFijos:        0,

        aplicaIva:            true,
        tasaIva:              tasaIva2,
        tasaMoratoriaAnual:   tasaMora2,
        diasGracia:           3,
        capitalizaMoratorios: false,

        valorInmueble: null,
        notas:         'Crédito personal de muestra — operación activa',

        bloques: {
          create: [1, 2, 3, 4, 5].map(num => ({
            numeroBloque: num,
            status:       'CERRADO',
            resultado:    num < 5 ? 'VALIDADO' : 'FORMALIZADO',
            fechaInicio:  new Date(2025, 0, num),
            fechaCierre:  new Date(2025, 0, num + 5),
            checklistItems: { create: [] },
          })),
        },
      },
    });

    // Participación única: Lomas 100%
    await prisma.participacion.create({
      data: {
        operacionId:            op2.id,
        inversionistaId:        invLomas.id,
        porcentajeParticipacion: 1.0,
        montoAportado:          monto2,
        tasaNeta:               0.14,
        esSofom:                false,
        orden:                  0,
      },
    });

    // Tabla de amortización — primeros 12 pagos marcados como pagados
    const now  = new Date();
    const filas = amort2.filas.map((fila, idx) => {
      const ivaImporte    = Math.round(fila.pagoIntereses * tasaIva2 * 100) / 100;
      const pagoTotal     = Math.round((fila.pagoTotal + ivaImporte) * 100) / 100;
      const esPagado      = fila.fecha < now;
      return {
        operacionId:      op2.id,
        numeroPago:       fila.mes,
        fechaVencimiento: fila.fecha,
        capitalTotal:     fila.pagoCapital,
        interesTotal:     fila.pagoIntereses,
        iva:              ivaImporte,
        pagoTotal,
        saldo:            fila.saldo,
        status:           (esPagado ? 'PAGADO' : 'PENDIENTE') as StatusPago,
        montoPagado:      esPagado ? pagoTotal : undefined,
        fechaPagoReal:    esPagado ? new Date(fila.fecha.getTime() + 86_400_000) : undefined,
        registradoPorId:  esPagado ? admin.id : undefined,
      };
    });
    await prisma.pagoMensual.createMany({ data: filas });

    // Historial
    await prisma.historialMovimiento.create({
      data: {
        operacionId: op2.id, usuarioId: admin.id,
        tipo: 'CREACION', descripcion: 'Operación INY-SEED-002 creada',
        detalle: 'Producto: PERSONAL | Monto: $800,000 | Plazo: 24 meses',
        creadoEn: new Date('2025-01-05T10:00:00'),
      },
    });

    console.log('✓ Operación 2 creada:', op2.folio, '| PMT acreditado:', amort2.pmt);
  } else {
    console.log('— Operación 2 ya existe, omitiendo.');
  }

  console.log('');
  console.log('🎉 Seed completado exitosamente.');
  console.log('   Credenciales:');
  console.log('   admin@inyecta.com.mx     / Admin123!');
  console.log('   juridico@inyecta.com.mx  / Legal123!');
  console.log('   operador@inyecta.com.mx  / Oper123!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
