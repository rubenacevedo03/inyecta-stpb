import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Inversionistas are now embedded in Operacion. These endpoints
// expose a read-only view of inversionistas across all operations.

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const items = await prisma.inversionista.findMany({
      include: {
        operacion: {
          select: { folio: true, monto: true, status: true, acreditadoNombre: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await prisma.inversionista.findUnique({
      where: { id: req.params.id as string },
      include: {
        operacion: {
          select: { folio: true, monto: true, status: true, acreditadoNombre: true, producto: true },
        },
      },
    });
    if (!item) { res.status(404).json({ error: 'No encontrado' }); return; }
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
