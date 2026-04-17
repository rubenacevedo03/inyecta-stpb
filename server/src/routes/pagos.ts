import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { notificar } from '../lib/notificar';

const router = Router();
const prisma = new PrismaClient();

// GET /api/pagos/operacion/:operacionId
router.get('/operacion/:operacionId', authMiddleware, async (req, res) => {
  try {
    const pagos = await prisma.pagoMensual.findMany({
      where:   { operacionId: req.params.operacionId as string },
      orderBy: { numeroPago: 'asc' },
    });
    res.json(pagos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/pagos/:id/registrar — Registrar un pago
router.patch('/:id/registrar', authMiddleware, async (req: any, res) => {
  try {
    const {
      montoPagado, fechaPago, notas,
      interesesMoratorios, ivaMoratorios, diasAtraso, diasMora,
    } = req.body;

    const pago = await prisma.pagoMensual.findUnique({
      where: { id: req.params.id as string },
    });
    if (!pago) { res.status(404).json({ error: 'Pago no encontrado' }); return; }

    const monto      = montoPagado ?? Number(pago.pagoTotal);
    const totalEsperado = Number(pago.pagoTotal)
      + Number(pago.interesesMoratorios || 0)
      + Number(pago.ivaMoratorios || 0);

    const status = monto >= totalEsperado ? 'PAGADO'
      : monto > 0 ? 'PARCIAL'
      : 'PENDIENTE';

    const updated = await prisma.pagoMensual.update({
      where: { id: req.params.id as string },
      data: {
        montoPagado:    monto,
        fechaPagoReal:  fechaPago ? new Date(fechaPago) : new Date(),
        registradoPorId: req.user?.id,
        status,
        notas,
        ...(interesesMoratorios !== undefined && { interesesMoratorios }),
        ...(ivaMoratorios       !== undefined && { ivaMoratorios }),
        ...(diasAtraso          !== undefined && { diasAtraso }),
        ...(diasMora            !== undefined && { diasMora }),
      },
    });

    // Historial
    const op = await prisma.operacion.findUnique({
      where:  { id: pago.operacionId },
      select: { id: true },
    });
    if (op) {
      await prisma.historialMovimiento.create({
        data: {
          operacionId: op.id,
          usuarioId:   req.user?.id,
          tipo:        'PAGO_REGISTRADO',
          descripcion: `Pago #${pago.numeroPago} registrado — $${monto.toLocaleString('es-MX')}`,
          detalle:     status,
        },
      });
      // Notificación asíncrona (no bloquea respuesta)
      notificar({
        tipo:        'PAGO_REGISTRADO',
        titulo:      `Pago #${pago.numeroPago} registrado`,
        descripcion: `$${monto.toLocaleString('es-MX')} — ${status}`,
        operacionId: op.id,
        excluir:     req.user?.id ? [req.user.id] : [],
      }).catch(console.error);
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/pagos/:id/moratorios — Actualizar moratorios de un pago
router.patch('/:id/moratorios', authMiddleware, async (req, res) => {
  try {
    const { interesesMoratorios, ivaMoratorios, diasAtraso, diasMora } = req.body;
    const updated = await prisma.pagoMensual.update({
      where: { id: req.params.id as string },
      data: {
        ...(interesesMoratorios !== undefined && { interesesMoratorios }),
        ...(ivaMoratorios       !== undefined && { ivaMoratorios }),
        ...(diasAtraso          !== undefined && { diasAtraso }),
        ...(diasMora            !== undefined && { diasMora }),
        status: 'VENCIDO',
      },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/pagos/:id/condonar — Condonar un pago
router.patch('/:id/condonar', authMiddleware, async (req: any, res) => {
  try {
    const { motivoCondonacion } = req.body;
    const pago = await prisma.pagoMensual.findUnique({
      where: { id: req.params.id as string },
    });
    if (!pago) { res.status(404).json({ error: 'Pago no encontrado' }); return; }

    const updated = await prisma.pagoMensual.update({
      where: { id: req.params.id as string },
      data: {
        status:            'CONDONADO',
        motivoCondonacion: motivoCondonacion || null,
        condonadoPor:      req.user?.id,
        montoOriginal:     pago.pagoTotal,
        montoPagado:       0,
      },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pagos/marcar-vencidos — Marcar vencidos en lote
router.post('/marcar-vencidos', authMiddleware, async (_req, res) => {
  try {
    const result = await prisma.pagoMensual.updateMany({
      where: {
        status:           'PENDIENTE',
        fechaVencimiento: { lt: new Date() },
        operacion:        { status: 'ACTIVA' },
      },
      data: { status: 'VENCIDO' },
    });
    res.json({ actualizados: result.count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
