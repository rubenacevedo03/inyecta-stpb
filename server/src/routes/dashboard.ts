import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    // Cartera activa
    const operacionesActivas = await prisma.operacion.findMany({
      where: { status: 'ACTIVA' },
      include: { inversionistas: true },
    });
    const carteraTotal = operacionesActivas.reduce((sum, op) => sum + op.monto, 0);

    // Conteo por status
    const porStatus = await prisma.operacion.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // Conteo por bloque actual (operaciones en análisis)
    const porBloque = await prisma.operacion.groupBy({
      by: ['bloqueActual'],
      where: { status: { in: ['PROSPECTO', 'ANALISIS'] } },
      _count: { id: true },
    });

    // Pagos del mes actual
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const pagosMes = await prisma.pagoMensual.findMany({
      where: {
        fechaVencimiento: { gte: inicioMes, lte: finMes },
        operacion: { status: 'ACTIVA' },
      },
    });

    const cobranzaEsperada = pagosMes.reduce((sum, p) => sum + p.pagoTotal, 0);
    const cobranzaReal = pagosMes
      .filter(p => p.status === 'PAGADO')
      .reduce((sum, p) => sum + (p.montoPagado || p.pagoTotal), 0);

    // Morosidad
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

    // Top inversionistas
    const topInversionistas = await prisma.inversionista.groupBy({
      by: ['nombre'],
      _sum: { monto: true },
      orderBy: { _sum: { monto: 'desc' } },
      take: 5,
    });

    // Operaciones por producto
    const porProducto = await prisma.operacion.groupBy({
      by: ['producto'],
      _count: { id: true },
      _sum: { monto: true },
    });

    res.json({
      carteraTotal,
      operacionesActivas: operacionesActivas.length,
      porStatus: porStatus.map(s => ({ status: s.status, count: s._count.id })),
      porBloque: porBloque.map(b => ({ bloque: b.bloqueActual, count: b._count.id })),
      porProducto: porProducto.map(p => ({
        producto: p.producto,
        count: p._count.id,
        monto: p._sum.monto || 0,
      })),
      cobranza: {
        esperada: Math.round(cobranzaEsperada * 100) / 100,
        real: Math.round(cobranzaReal * 100) / 100,
        porcentaje: cobranzaEsperada > 0
          ? Math.round((cobranzaReal / cobranzaEsperada) * 10000) / 100
          : 0,
      },
      morosidad: Math.round(morosidad * 10000) / 100,
      topInversionistas: topInversionistas.map(inv => ({
        nombre: inv.nombre,
        montoTotal: inv._sum.monto || 0,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
