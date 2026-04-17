import { PrismaClient, TipoNotificacion, Rol } from '@prisma/client';

const prisma = new PrismaClient();

interface NotifOpts {
  tipo:        TipoNotificacion;
  titulo:      string;
  descripcion: string;
  operacionId?: string;
  solicitudId?: string;
  /** IDs de usuarios que ya recibirán la notif (para no duplicar) */
  excluir?: string[];
}

/**
 * Crea una notificación para el ejecutivo de la operación
 * y para todos los usuarios ADMIN activos.
 * Si tipo incluye SOLICITUD_*, también notifica a LEGAL.
 */
export async function notificar(opts: NotifOpts): Promise<void> {
  const { tipo, titulo, descripcion, operacionId, solicitudId, excluir = [] } = opts;

  // Roles a notificar según el tipo
  const rolesExtra: Rol[] = tipo.startsWith('SOLICITUD') ? ['ADMIN', 'LEGAL'] : ['ADMIN'];

  // Usuarios a notificar: ejecutivo de la op + roles relevantes
  const targets = new Set<string>();

  if (operacionId) {
    const op = await prisma.operacion.findUnique({
      where:  { id: operacionId },
      select: { ejecutivoId: true },
    });
    if (op?.ejecutivoId) targets.add(op.ejecutivoId);
  }

  const admins = await prisma.usuario.findMany({
    where:  { rol: { in: rolesExtra }, activo: true },
    select: { id: true },
  });
  admins.forEach(u => targets.add(u.id));

  // Filtrar excluidos
  excluir.forEach(id => targets.delete(id));

  // Crear notificaciones en paralelo (fire-and-forget, no bloquea la respuesta)
  await Promise.allSettled(
    Array.from(targets).map(usuarioId =>
      prisma.notificacion.create({
        data: { usuarioId, tipo, titulo, descripcion, operacionId: operacionId ?? null, solicitudId: solicitudId ?? null },
      })
    )
  );
}
