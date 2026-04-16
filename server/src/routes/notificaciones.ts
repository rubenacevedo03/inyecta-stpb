import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const notifs = await prisma.notificacion.findMany({
      where: { usuarioId: req.user!.id },
      orderBy: { creadoEn: 'desc' },
      take: 50,
    });
    res.json(notifs);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/leida', authMiddleware, async (req: Request, res: Response) => {
  try {
    await prisma.notificacion.update({ where: { id: req.params.id as string }, data: { leida: true } });
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/todas-leidas', authMiddleware, async (req: Request, res: Response) => {
  try {
    await prisma.notificacion.updateMany({ where: { usuarioId: req.user!.id, leida: false }, data: { leida: true } });
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
