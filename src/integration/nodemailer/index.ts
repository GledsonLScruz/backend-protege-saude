import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const smtpHost = 'smtp.gmail.com';
const smtpPort = 465;
const smtpSecure = true;

function assertMailConfig() {
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
