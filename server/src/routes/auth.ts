import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken, authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'El email ya está registrado' });
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.usuario.create({
      data: { nombre, email, password: hash, rol: rol || 'OPERADOR' },
      select: { id: true, nombre: true, email: true, rol: true },
    });

    const token = generateToken({ id: user.id, email: user.email, rol: user.rol });
    res.status(201).json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user || !user.activo) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const token = generateToken({ id: user.id, email: user.email, rol: user.rol });
    res.json({
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: req.user!.id },
      select: { id: true, nombre: true, email: true, rol: true, creadoEn: true },
    });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
