import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { notificar } from '../lib/notificar';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { operacionId } = req.query;
    const where: any = {};
    if (operacionId) where.operacionId = operacionId;
    const sols = await prisma.solicitud.findMany({
      where,
      include: {
        generadaPor: { select: { nombre: true, rol: true } },
        dirigidaA: { select: { nombre: true, rol: true } },
        comentarios: { include: { usuario: { select: { nombre: true } } } },
      },
      orderBy: { creadoEn: 'desc' },
    });
    res.json(sols);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { operacionId, tipo, descripcion, dirigidaAId, bloqueNumero, fechaLimite } = req.body;
    const now = new Date();
    const folio = `SOL-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${Math.floor(Math.random()*9000+1000)}`;
    const sol = await prisma.solicitud.create({
      data: {
        folio, operacionId, tipo, descripcion,
        generadaPorId: req.user!.id,
        dirigidaAId,
        bloqueNumero,
        fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
      },
    });
    // Notificar al destinatario directo + ADMIN
    if (dirigidaAId) {
      await prisma.notificacion.create({
        data: {
          usuarioId:   dirigidaAId,
          tipo:        'SOLICITUD_RECIBIDA',
          titulo:      `Nueva solicitud: ${folio}`,
          descripcion: `${tipo}`,
          operacionId,
          solicitudId: sol.id,
        },
      });
    }
    notificar({
      tipo:        'SOLICITUD_RECIBIDA',
      titulo:      `Nueva solicitud: ${folio}`,
      descripcion: tipo,
      operacionId,
      solicitudId: sol.id,
      excluir:     [req.user!.id, ...(dirigidaAId ? [dirigidaAId] : [])],
    }).catch(console.error);
    // History
    await prisma.historialMovimiento.create({
      data: {
        operacionId,
        usuarioId: req.user!.id,
        tipo: 'SOLICITUD_GENERADA',
        descripcion: `Solicitud ${folio} generada: ${tipo}`,
      },
    });
    res.status(201).json(sol);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, fechaCompletada } = req.body;
    const sol = await prisma.solicitud.update({
      where: { id: req.params.id as string },
      data: { status, fechaCompletada: fechaCompletada ? new Date(fechaCompletada) : undefined },
    });

    if (status === 'COMPLETADA') {
      notificar({
        tipo:        'SOLICITUD_COMPLETADA',
        titulo:      `Solicitud completada: ${sol.folio}`,
        descripcion: `${sol.tipo}`,
        operacionId: sol.operacionId ?? undefined,
        solicitudId: sol.id,
        excluir:     req.user ? [(req.user as any).id] : [],
      }).catch(console.error);
    }
    res.json(sol);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/comentarios', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { texto } = req.body;
    const comentario = await prisma.comentarioSolicitud.create({
      data: { solicitudId: req.params.id as string, usuarioId: req.user!.id, texto },
    });
    res.status(201).json(comentario);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
