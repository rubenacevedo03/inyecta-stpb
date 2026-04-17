import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/participaciones/operacion/:operacionId
router.get('/operacion/:operacionId', authMiddleware, async (req, res) => {
  try {
    const items = await prisma.participacion.findMany({
      where: { operacionId: req.params.operacionId as string },
      include: { inversionista: true },
      orderBy: { orden: 'asc' },
    });
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/participaciones
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      operacionId, inversionistaId,
      porcentajeParticipacion, montoAportado, tasaNeta,
      esSofom, orden,
    } = req.body;

    if (!operacionId || !inversionistaId) {
      res.status(400).json({ error: 'operacionId e inversionistaId son requeridos' });
      return;
    }
    if (porcentajeParticipacion == null || montoAportado == null || tasaNeta == null) {
      res.status(400).json({ error: 'porcentajeParticipacion, montoAportado y tasaNeta son requeridos' });
      return;
    }

    const item = await prisma.participacion.create({
      data: {
        operacionId,
        inversionistaId,
        porcentajeParticipacion,
        montoAportado,
        tasaNeta,
        esSofom: esSofom ?? false,
        orden:   orden   ?? 0,
      },
      include: { inversionista: true },
    });
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/participaciones/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const {
      porcentajeParticipacion, montoAportado, tasaNeta, esSofom, orden,
    } = req.body;

    const item = await prisma.participacion.update({
      where: { id: req.params.id as string },
      data: {
        ...(porcentajeParticipacion !== undefined && { porcentajeParticipacion }),
        ...(montoAportado           !== undefined && { montoAportado }),
        ...(tasaNeta                !== undefined && { tasaNeta }),
        ...(esSofom                 !== undefined && { esSofom }),
        ...(orden                   !== undefined && { orden }),
      },
      include: { inversionista: true },
    });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/participaciones/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.participacion.delete({ where: { id: req.params.id as string } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
