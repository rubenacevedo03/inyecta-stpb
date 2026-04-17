import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/inversionistas?q=texto
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    const where: any = {};
    if (q) {
      where.OR = [
        { nombre:      { contains: String(q), mode: 'insensitive' } },
        { rfc:         { contains: String(q), mode: 'insensitive' } },
        { email:       { contains: String(q), mode: 'insensitive' } },
        { cuentaClabe: { contains: String(q), mode: 'insensitive' } },
      ];
    }
    const items = await prisma.inversionista.findMany({
      where,
      include: { _count: { select: { participaciones: true } } },
      orderBy: { nombre: 'asc' },
    });
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inversionistas/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await prisma.inversionista.findUnique({
      where: { id: req.params.id as string },
      include: {
        participaciones: {
          include: {
            operacion: {
              select: {
                id: true, folio: true, monto: true,
                status: true, producto: true,
              },
            },
          },
          orderBy: { fechaAlta: 'desc' },
        },
      },
    });
    if (!item) { res.status(404).json({ error: 'Inversionista no encontrado' }); return; }
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inversionistas
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nombre, rfc, banco, cuentaClabe, email, telefono } = req.body;
    if (!nombre) { res.status(400).json({ error: 'nombre es requerido' }); return; }
    const item = await prisma.inversionista.create({
      data: {
        nombre,
        rfc:         rfc         || null,
        banco:       banco       || null,
        cuentaClabe: cuentaClabe || null,
        email:       email       || null,
        telefono:    telefono    || null,
      },
    });
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/inversionistas/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { nombre, rfc, banco, cuentaClabe, email, telefono } = req.body;
    const item = await prisma.inversionista.update({
      where: { id: req.params.id as string },
      data: {
        ...(nombre      !== undefined && { nombre }),
        ...(rfc         !== undefined && { rfc }),
        ...(banco       !== undefined && { banco }),
        ...(cuentaClabe !== undefined && { cuentaClabe }),
        ...(email       !== undefined && { email }),
        ...(telefono    !== undefined && { telefono }),
      },
    });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
