import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/acreditados?q=texto
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    const where: any = {};
    if (q) {
      where.OR = [
        { nombre:   { contains: String(q), mode: 'insensitive' } },
        { rfc:      { contains: String(q), mode: 'insensitive' } },
        { email:    { contains: String(q), mode: 'insensitive' } },
        { telefono: { contains: String(q), mode: 'insensitive' } },
      ];
    }
    const items = await prisma.acreditado.findMany({
      where,
      include: { _count: { select: { operaciones: true } } },
      orderBy: { nombre: 'asc' },
    });
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/acreditados/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await prisma.acreditado.findUnique({
      where: { id: req.params.id as string },
      include: {
        operaciones: {
          select: {
            id: true, folio: true, monto: true, status: true,
            producto: true, creadoEn: true,
          },
          orderBy: { creadoEn: 'desc' },
        },
      },
    });
    if (!item) { res.status(404).json({ error: 'Acreditado no encontrado' }); return; }
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/acreditados
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nombre, rfc, telefono, email, direccion, tipoPersona } = req.body;
    if (!nombre) { res.status(400).json({ error: 'nombre es requerido' }); return; }
    const item = await prisma.acreditado.create({
      data: {
        nombre,
        rfc:        rfc        || null,
        telefono:   telefono   || null,
        email:      email      || null,
        direccion:  direccion  || null,
        tipoPersona: tipoPersona || 'PF',
      },
    });
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/acreditados/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { nombre, rfc, telefono, email, direccion, tipoPersona } = req.body;
    const item = await prisma.acreditado.update({
      where: { id: req.params.id as string },
      data: {
        ...(nombre      !== undefined && { nombre }),
        ...(rfc         !== undefined && { rfc }),
        ...(telefono    !== undefined && { telefono }),
        ...(email       !== undefined && { email }),
        ...(direccion   !== undefined && { direccion }),
        ...(tipoPersona !== undefined && { tipoPersona }),
      },
    });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
