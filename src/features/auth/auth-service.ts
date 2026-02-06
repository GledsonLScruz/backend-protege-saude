import db from '../../database/db';
import { LoginRequestDTO } from './@types';
import { UsuarioAdminRepository } from './usuario-admin-repository';
import { verificarSenha } from './password-hash';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, JwtPayload } from './jwt-utils';
import { hashToken } from './token-hash';

export const AuthService = async () => {
  const database = await db;
  const repo = new UsuarioAdminRepository(database);

  const authenticate = async (credentials: LoginRequestDTO) => {
    if (!credentials.usuario?.trim() || !credentials.senha?.trim()) {
      throw new Error('Usuário e senha são obrigatórios');
    }

    const usuario = await repo.findByUsuario(credentials.usuario);
    if (!usuario) {
      throw new Error('Credenciais inválidas');
    }

    const ok = verificarSenha(credentials.senha, usuario.senha_hash);
    if (!ok) {
      throw new Error('Credenciais inválidas');
    }

    const payload = { id: usuario.id!, usuario: usuario.usuario };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await repo.updateRefreshTokenHash(payload.id, hashToken(refreshToken));

    return { usuario: payload, accessToken, refreshToken };
  };

  const refreshTokens = async (refreshToken: string) => {
    if (!refreshToken?.trim()) {
      throw new Error('Refresh token é obrigatório');
    }

    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error: any) {
      throw new Error(error?.name === 'TokenExpiredError' ? 'Refresh token expirado' : 'Refresh token inválido');
    }

    const user = await repo.findById(payload.id);
    if (!user || !user.refresh_token_hash) {
      throw new Error('Refresh token não reconhecido');
    }

    const incomingHash = hashToken(refreshToken);
    if (incomingHash !== user.refresh_token_hash) {
      throw new Error('Refresh token não reconhecido');
    }

    const newPayload = { id: user.id!, usuario: user.usuario };
    const accessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    await repo.updateRefreshTokenHash(user.id!, hashToken(newRefreshToken));

    return { usuario: newPayload, accessToken, refreshToken: newRefreshToken };
  };

  return { authenticate, refreshTokens };
};
