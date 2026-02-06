import { Request, Response } from 'express';
import { AuthService } from './auth-service';
import { LoginRequestDTO } from './@types';

export const login = async (req: Request, res: Response) => {
  const service = await AuthService();
  const body = req.body as LoginRequestDTO;

  try {
    const { usuario, accessToken, refreshToken } = await service.authenticate(body);
    return res.json({ message: 'Autenticado com sucesso', usuario, accessToken, refreshToken });
  } catch (error: any) {
    const message = error?.message || 'Erro ao autenticar';
    const status = message === 'Usuário e senha são obrigatórios'
      ? 400
      : message.includes('Credenciais inválidas')
        ? 401
        : 500;
    return res.status(status).json({ error: message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const service = await AuthService();
  const { refreshToken } = req.body || {};

  try {
    const { usuario, accessToken, refreshToken: newRefresh } = await service.refreshTokens(refreshToken);
    return res.json({ message: 'Tokens renovados com sucesso', usuario, accessToken, refreshToken: newRefresh });
  } catch (error: any) {
    const message = error?.message || 'Erro ao renovar token';
    const status = message.includes('obrigatório') ? 400 : message.includes('expirado') ? 401 : 401;
    return res.status(status).json({ error: message });
  }
};
