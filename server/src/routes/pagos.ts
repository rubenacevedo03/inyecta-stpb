import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/pagos/operacion/:operacionId
router.get('/operacion/:operacionId', authMiddleware, async (req, res) => {
  try {
    const pagos = await prisma.pagoMensual.findMany({
      where: { operacionId: req.params.operacionId as string },
      orderBy: { numeroPago: 'asc' },
    });
    res.json(pagos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/pagos/:id/registrar — Register a payment
router.patch('/:id/registrar', authMiddleware, async (req: any, res) => {
  try {
    const { montoPagado, fechaPago, notas } = req.body;
    const pago = await prisma.pagoMensual.findUnique({ where: { id: req.params.id as string } });
    if (!pago) { res.status(404).json({ error: 'Pago no encontrado' }); return; }

    const monto = montoPagado || pago.pagoTotal;
    const status = monto >= pago.pagoTotal ? 'PAGADO' : 'PARCIAL';

    const updated = await prisma.pagoMensual.update({
      where: { id: req.params.id as string },
      data: {
        montoPagado: monto,
        fechaPagoReal: fechaPago ? new Date(fechaPago) : new Date(),
        registradoPorId: req.user?.id,
        status,
        notas,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pagos/marcar-vencidos — Batch mark overdue payments
router.post('/marcar-vencidos', authMiddleware, async (_req, res) => {
  try {
    const result = await prisma.pagoMensual.updateMany({
      where: {
        status: 'PENDIENTE',
        fechaVencimiento: { lt: new Date() },
        operacion: { status: 'ACTIVA' },
      },
      data: { status: 'VENCIDO' },
    });
    res.json({ actualizados: result.count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
