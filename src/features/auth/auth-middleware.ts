import { NextFunction, Request, Response } from 'express';
import { JwtPayload, verifyAccessToken } from './jwt-utils';

declare global {
  namespace Express {
    interface Request {
      usuarioAutenticado?: JwtPayload;
    }
  }
}

export const autenticarJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.usuarioAutenticado = payload;
    return next();
  } catch (error: any) {
    const isSecretMissing = error?.message?.includes('JWT_SECRET');
    const message =
      error?.name === 'TokenExpiredError'
        ? 'Token expirado'
        : isSecretMissing
          ? 'Falha interna de autenticação'
          : 'Token inválido';

    const status = isSecretMissing ? 500 : 401;
    return res.status(status).json({ error: message });
  }
};
