import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, requireRole('ADMIN'), async (_req: Request, res: Response) => {
  try {
    const users = await prisma.usuario.findMany({
      select: { id: true, nombre: true, email: true, rol: true, activo: true, creadoEn: true },
      orderBy: { nombre: 'asc' },
    });
    res.json(users);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { nombre, email, password, rol } = req.body;
    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) { res.status(400).json({ error: 'Email ya registrado' }); return; }
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.usuario.create({
      data: { nombre, email, password: hash, rol },
      select: { id: true, nombre: true, email: true, rol: true, activo: true, creadoEn: true },
    });
    res.status(201).json(user);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { nombre, email, rol } = req.body;
    const user = await prisma.usuario.update({
      where: { id: req.params.id as string },
      data: { nombre, email, rol },
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    });
    res.json(user);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/toggle-activo', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const user = await prisma.usuario.findUnique({ where: { id: req.params.id as string } });
    if (!user) { res.status(404).json({ error: 'No encontrado' }); return; }
    const updated = await prisma.usuario.update({
      where: { id: req.params.id as string },
      data: { activo: !user.activo },
      select: { id: true, nombre: true, activo: true },
    });
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/reset-password', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const hash = await bcrypt.hash(password, 12);
    await prisma.usuario.update({ where: { id: req.params.id as string }, data: { password: hash } });
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
