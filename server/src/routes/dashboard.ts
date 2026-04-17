import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    // ── Cartera activa ────────────────────────────────────────────────────────
    const operacionesActivas = await prisma.operacion.findMany({
      where: { status: 'ACTIVA' },
      select: { id: true, monto: true },
    });
    // monto es Decimal → convertir a number
    const carteraTotal = operacionesActivas.reduce(
      (sum, op) => sum + Number(op.monto), 0,
    );

    // ── Conteos por status y bloque ───────────────────────────────────────────
    const porStatus = await prisma.operacion.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const porBloque = await prisma.operacion.groupBy({
      by: ['bloqueActual'],
      where: { status: { in: ['PROSPECTO', 'ANALISIS'] } },
      _count: { id: true },
    });

    // ── Pagos del mes actual ──────────────────────────────────────────────────
    const now       = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const finMes    = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const pagosMes = await prisma.pagoMensual.findMany({
      where: {
        fechaVencimiento: { gte: inicioMes, lte: finMes },
        operacion: { status: 'ACTIVA' },
      },
      select: { status: true, pagoTotal: true, montoPagado: true },
    });

    const cobranzaEsperada = pagosMes.reduce((sum, p) => sum + Number(p.pagoTotal), 0);
    const cobranzaReal     = pagosMes
      .filter(p => p.status === 'PAGADO')
      .reduce((sum, p) => sum + Number(p.montoPagado || p.pagoTotal), 0);

    // ── Morosidad ─────────────────────────────────────────────────────────────
    const pagosVencidos = await prisma.pagoMensual.count({
      where: { status: 'VENCIDO', operacion: { status: 'ACTIVA' } },
    });
    const totalPagosActivos = await prisma.pagoMensual.count({
      where: {
        operacion: { status: 'ACTIVA' },
        status: { in: ['PENDIENTE', 'VENCIDO', 'PAGADO', 'PARCIAL'] },
      },
    });
    const morosidad = totalPagosActivos > 0 ? pagosVencidos / totalPagosActivos : 0;

    // ── Top inversionistas (por monto aportado en Participacion) ──────────────
    const topPart = await prisma.participacion.groupBy({
      by: ['inversionistaId'],
      _sum: { montoAportado: true },
      orderBy: { _sum: { montoAportado: 'desc' } },
      take: 5,
    });

    const invIds  = topPart.map(p => p.inversionistaId);
    const invMap  = invIds.length
      ? await prisma.inversionista.findMany({
          where:  { id: { in: invIds } },
          select: { id: true, nombre: true },
        })
      : [];
    const invByID = Object.fromEntries(invMap.map(i => [i.id, i.nombre]));

    const topInversionistas = topPart.map(p => ({
      nombre:     invByID[p.inversionistaId] || 'Desconocido',
      montoTotal: Number(p._sum.montoAportado) || 0,
    }));

    // ── Por producto ──────────────────────────────────────────────────────────
    const porProducto = await prisma.operacion.groupBy({
      by: ['producto'],
      _count: { id: true },
      _sum:   { monto: true },
    });

    res.json({
      carteraTotal: Math.round(carteraTotal * 100) / 100,
      operacionesActivas: operacionesActivas.length,
      porStatus:  porStatus.map(s  => ({ status:   s.status,        count: s._count.id })),
      porBloque:  porBloque.map(b  => ({ bloque:   b.bloqueActual,  count: b._count.id })),
      porProducto: porProducto.map(p => ({
        producto: p.producto,
        count:    p._count.id,
        monto:    Number(p._sum.monto) || 0,
      })),
      cobranza: {
        esperada:   Math.round(cobranzaEsperada * 100) / 100,
        real:       Math.round(cobranzaReal     * 100) / 100,
        porcentaje: cobranzaEsperada > 0
          ? Math.round((cobranzaReal / cobranzaEsperada) * 10000) / 100
          : 0,
      },
      morosidad: Math.round(morosidad * 10000) / 100,
      topInversionistas,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
