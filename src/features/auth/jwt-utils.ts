import jwt from 'jsonwebtoken';

export type JwtPayload = {
  id: number;
  usuario: string;
};

const getRequired = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} não configurado`);
  return value;
};

export const generateAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, getRequired('JWT_SECRET'), { expiresIn: '1h' });

export const generateRefreshToken = (payload: JwtPayload) =>
  jwt.sign(payload, getRequired('JWT_REFRESH_SECRET'), { expiresIn: '30d' });

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, getRequired('JWT_SECRET')) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, getRequired('JWT_REFRESH_SECRET')) as JwtPayload;
