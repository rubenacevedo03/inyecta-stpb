import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-cambiar-en-produccion';
const prisma = new PrismaClient();

export interface JwtPayload {
  id: string;
  email: string;
  rol: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Verificar que el usuario aún existe en DB (protege contra tokens de sesiones antiguas)
    prisma.usuario.findUnique({ where: { id: decoded.id }, select: { id: true, activo: true } })
      .then((usuario) => {
        if (!usuario || !usuario.activo) {
          res.status(401).json({ error: 'Sesión expirada — vuelve a iniciar sesión' });
          return;
        }
        req.user = decoded;
        next();
      })
      .catch(() => {
        res.status(401).json({ error: 'Sesión expirada — vuelve a iniciar sesión' });
      });
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.rol)) {
      res.status(403).json({ error: 'Permisos insuficientes' });
      return;
    }
    next();
  };
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}
