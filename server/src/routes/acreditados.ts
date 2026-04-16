import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Acreditados are now inline in Operacion. This route returns a
// deduplicated list of acreditados extracted from existing operations.

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const ops = await prisma.operacion.findMany({
      select: {
        acreditadoNombre: true,
        acreditadoRfc: true,
        acreditadoTipo: true,
        acreditadoTelefono: true,
        acreditadoEmail: true,
        acreditadoDireccion: true,
      },
      orderBy: { acreditadoNombre: 'asc' },
    });
    // Deduplicate by RFC, fallback to name
    const seen = new Set<string>();
    const unique = ops.filter(op => {
      const key = op.acreditadoRfc || op.acreditadoNombre;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    res.json(unique);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
