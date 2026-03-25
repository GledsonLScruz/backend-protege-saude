import { transporter } from '../../integration/nodemailer';
import { EnviarDenunciaRequest, Regiao } from './@types';
import { DenunciaRepository } from './denuncia-repository';
import db from '../../database/db';
import { v4 as uuidv4 } from 'uuid';
import { ProfissaoRepository } from '../profissao/profissao-repository';

export const EMAIL_POR_REGIAO: Record<Regiao, string> = {
  [Regiao.NORTE]: process.env.CONSELHO_REGIAO_NORTE_EMAIL!,
  [Regiao.SUL]: process.env.CONSELHO_REGIAO_SUL_EMAIL!,
  [Regiao.LESTE]: process.env.CONSELHO_REGIAO_LESTE_EMAIL!,
  [Regiao.OESTE]: process.env.CONSELHO_REGIAO_OESTE_EMAIL!
};

export const DenunciaService = async () => {
  const database = await db
  const denunciaRepo = new DenunciaRepository(database);
  const profissaoRepo = new ProfissaoRepository(database);

  function gerarProtocolo(): string {
    const ano = new Date().getFullYear();
    const uuid = uuidv4().split('-')[0];
    return `DEN-${ano}-${uuid.toUpperCase()}`;
  }

  const enviarDenuncia = async (body: EnviarDenunciaRequest) => {
    if (!Object.values(Regiao).includes(body.regiao)) {
      throw new Error('Região inválida.');
    }

    if (!Number.isInteger(body.profissao_id) || body.profissao_id <= 0) {
      throw new Error('Profissão inválida.');
    }

    const profissao = await profissaoRepo.buscarPorId(body.profissao_id);
    if (!profissao) {
      throw new Error('Profissão não encontrada.');
    }
    if (profissao.status !== 1) {
      throw new Error('Profissão inativa.');
    }

    if (!body.pdf) {
      throw new Error('O arquivo PDF é obrigatório.');
    }

    const emailDestino = EMAIL_POR_REGIAO[body.regiao];
    if (!emailDestino) {
      throw new Error('Região inválida.');
    }

    const protocolo = gerarProtocolo();

    const subject = 'Nova Denúncia Recebida - OdontoGuardião';
    const emailBody = `
    Prezados,

    Uma nova denúncia foi registrada no sistema OdontoGuardião.

    Protocolo: ${protocolo}
    Data: ${new Date().toLocaleDateString('pt-BR')}
    Hora: ${new Date().toLocaleTimeString('pt-BR')}

    Esta é uma mensagem automática. Por favor, não responda a este e-mail.

    Atenciosamente,
    Equipe OdontoGuardião
    `;

    const attachments = [];

    if (body.pdf) {
      attachments.push({
        filename: body.pdf.originalname,
        content: body.pdf.buffer,
      });
    }

    try {
      const info = await transporter.sendMail({
        from: process.env.ODONTO_GUARDIAO_EMAIL,
        to: emailDestino,
        subject,
        text: emailBody,
        attachments,
      });

      const denunciaId = await denunciaRepo.criar({
        protocolo,
        regiao: body.regiao,
        profissao_id: body.profissao_id,
      })

      console.log(`Email enviado: ${info.response}`);
      return { success: true, protocolo, message: 'Denúncia enviada com sucesso.' };
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error);
      throw error instanceof Error ? error : new Error('Erro ao enviar denúncia.');
    }
  }

  const listaTodasDenuncias = async () => {
    return await denunciaRepo.listarTodas()
  }

  return {
    enviarDenuncia,
    listaTodasDenuncias
  }
}
