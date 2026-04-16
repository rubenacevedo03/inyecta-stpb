import { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MUTACIONES = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Middleware de auditoría PLD.
 * Registra en Bitacora toda mutación exitosa (2xx) sobre rutas protegidas.
 *
 * Uso:
 *   router.use(bitacoraMiddleware('Operacion'));
 *   // O por ruta:
 *   router.post('/', bitacoraMiddleware('Acreditado'), handler);
 */
export function bitacoraMiddleware(entidad: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!MUTACIONES.has(req.method)) { next(); return; }

    // Interceptar res.json para capturar el id devuelto
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      const statusCode = res.statusCode;
      const user       = (req as any).user;

      if (statusCode >= 200 && statusCode < 300 && user?.id) {
        const entidadId = body?.id ?? (req.params.id || null);
        prisma.bitacora
          .create({
            data: {
              usuarioId:   user.id,
              accion:      `${req.method} ${req.path}`,
              entidad,
              entidadId:   entidadId || null,
              payloadJson: req.method !== 'GET' ? req.body : undefined,
              ip:          req.ip || null,
            },
          })
          .catch(err => console.error('[bitacora]', err.message));
      }

      return originalJson(body);
    };

    next();
  };
}
