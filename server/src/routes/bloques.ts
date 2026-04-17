import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { notificar } from '../lib/notificar';

const router = Router();
const prisma = new PrismaClient();

// GET /api/bloques/:opId/:num
router.get('/:opId/:num', authMiddleware, async (req: Request, res: Response) => {
  try {
    const bloque = await prisma.bloqueOperacion.findUnique({
      where: {
        operacionId_numeroBloque: {
          operacionId: req.params.opId as string,
          numeroBloque: parseInt(req.params.num as string),
        },
      },
      include: {
        checklistItems: { orderBy: { orden: 'asc' } },
        responsable: { select: { id: true, nombre: true } },
      },
    });
    if (!bloque) { res.status(404).json({ error: 'Bloque no encontrado' }); return; }
    res.json(bloque);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/bloques/checklist/:itemId
router.patch('/checklist/:itemId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { completado, nota } = req.body;
    const item = await prisma.checklistItem.update({
      where: { id: req.params.itemId as string },
      data: {
        completado,
        nota,
        completadoPorId: completado ? req.user!.id : null,
        fechaCompletado: completado ? new Date() : null,
      },
    });
    // Log history
    const bloque = await prisma.bloqueOperacion.findUnique({ where: { id: item.bloqueId } });
    if (bloque) {
      await prisma.historialMovimiento.create({
        data: {
          operacionId: bloque.operacionId,
          usuarioId: req.user!.id,
          tipo: 'CAMBIO_CHECKLIST',
          descripcion: `Checklist ${completado ? 'marcado' : 'desmarcado'}: ${item.descripcion}`,
          detalle: nota,
        },
      });
    }
    res.json(item);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/bloques/:bloqueId/resultado — Set block result
router.patch('/:bloqueId/resultado', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { resultado, condiciones, motivoRechazo } = req.body;
    const bloque = await prisma.bloqueOperacion.update({
      where: { id: req.params.bloqueId as string },
      data: { resultado, condiciones, motivoRechazo, status: resultado },
    });
    await prisma.historialMovimiento.create({
      data: {
        operacionId: bloque.operacionId,
        usuarioId: req.user!.id,
        tipo: 'CAMBIO_ESTATUS',
        descripcion: `Bloque ${bloque.numeroBloque} — resultado: ${resultado}`,
        detalle: condiciones || motivoRechazo,
      },
    });
    res.json(bloque);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/bloques/:opId/avanzar — Advance to next block
router.post('/:opId/avanzar', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { bloqueActual } = req.body;
    const nextBloque = bloqueActual + 1;
    if (nextBloque > 5) { res.status(400).json({ error: 'No hay más bloques' }); return; }

    // Activate next block
    await prisma.bloqueOperacion.update({
      where: {
        operacionId_numeroBloque: { operacionId: req.params.opId as string, numeroBloque: nextBloque },
      },
      data: { status: 'EN_PROCESO', fechaInicio: new Date() },
    });

    // Update operation current block
    const op = await prisma.operacion.update({
      where: { id: req.params.opId as string },
      data: {
        bloqueActual: nextBloque,
        status: nextBloque === 5 ? 'APROBADA' : 'ANALISIS',
      },
    });

    await prisma.historialMovimiento.create({
      data: {
        operacionId: op.id,
        usuarioId: req.user!.id,
        tipo: 'AVANCE_BLOQUE',
        descripcion: `Avance de Bloque ${bloqueActual} → Bloque ${nextBloque}`,
      },
    });

    notificar({
      tipo:        'BLOQUE_AVANZADO',
      titulo:      `Bloque ${bloqueActual} completado`,
      descripcion: `La operación avanzó al Bloque ${nextBloque}`,
      operacionId: op.id,
      excluir:     [req.user!.id],
    }).catch(console.error);

    res.json(op);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
