import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null || value.trim() === '') {
    return defaultValue;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (['true', '1', 'yes', 'y', 'on'].includes(normalizedValue)) {
    return true;
  }

  if (['false', '0', 'no', 'n', 'off'].includes(normalizedValue)) {
    return false;
  }

  throw new Error(`Configuração de e-mail inválida: valor booleano inválido para SMTP_SECURE: ${value}`);
}

const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = parseBooleanEnv(process.env.SMTP_SECURE, smtpPort === 465);

export const smtpConfig = {
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
};

function assertMailConfig() {
  if (!smtpHost) {
    throw new Error('Configuração de e-mail inválida: SMTP_HOST não definido.');
  }

  if (!process.env.ODONTO_GUARDIAO_EMAIL?.trim()) {
    throw new Error('Configuração de e-mail inválida: ODONTO_GUARDIAO_EMAIL não definido.');
  }

  if (!process.env.ODONTO_GUARDIAO_PWD?.trim()) {
    throw new Error('Configuração de e-mail inválida: ODONTO_GUARDIAO_PWD não definido.');
  }

  if (!Number.isInteger(smtpPort) || smtpPort <= 0) {
    throw new Error('Configuração de e-mail inválida: SMTP_PORT deve ser um número válido.');
  }
}

assertMailConfig();

export const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.ODONTO_GUARDIAO_EMAIL,
    pass: process.env.ODONTO_GUARDIAO_PWD,
  },
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 10000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 10000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 20000),
  tls: {
    servername: smtpHost,
  },
});
