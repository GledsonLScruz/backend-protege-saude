import axios from 'axios';
import { smtpConfig, transporter } from '../../integration/nodemailer';
import { EnviarDenunciaRequest } from './@types';
import { DenunciaRepository } from './denuncia-repository';
import db from '../../database/db';
import { v4 as uuidv4 } from 'uuid';
import { ProfissaoRepository } from '../profissao/profissao-repository';
import { ConselhoTutelarRepository } from '../conselho-tutelar/conselho-tutelar-repository';
import { LocalidadesService } from '../localidades/localidades-service';

const normalizarTextoObrigatorio = (value: string, nomeCampo: string): string => {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(`${nomeCampo} é obrigatório.`);
  return normalized;
};

type ViaCepResponse = {
  erro?: boolean;
  cep?: string;
  uf?: string;
  localidade?: string;
  bairro?: string;
  logradouro?: string;
};

type ValidarCepCodigoErro =
  | 'CEP_INVALIDO'
  | 'CEP_NAO_ENCONTRADO'
  | 'BAIRRO_NAO_IDENTIFICADO'
  | 'BAIRRO_FORA_DO_CATALOGO'
  | 'CONSELHO_NAO_CADASTRADO'
  | 'ERRO_CONSULTA_CEP';

type ValidarCepBloqueado = {
  podeProsseguir: false;
  codigo: ValidarCepCodigoErro;
  mensagem: string;
};

type ValidarCepSucesso = {
  podeProsseguir: true;
  endereco: {
    cep: string;
    estado: string;
    cidade: string;
    bairro: string;
    logradouro: string;
    rua: string;
  };
  conselho: {
    id: number;
    nome: string;
  };
};

export type ValidarCepResult = ValidarCepSucesso | ValidarCepBloqueado;

const bloquearCep = (codigo: ValidarCepCodigoErro, mensagem: string): ValidarCepBloqueado => ({
  podeProsseguir: false,
  codigo,
  mensagem,
});

export const DenunciaService = async () => {
  const database = await db
  const denunciaRepo = new DenunciaRepository(database);
  const profissaoRepo = new ProfissaoRepository(database);
  const conselhoRepo = new ConselhoTutelarRepository(database);

  function gerarProtocolo(): string {
    const ano = new Date().getFullYear();
    const uuid = uuidv4().split('-')[0];
    return `DEN-${ano}-${uuid.toUpperCase()}`;
  }

  const validarCep = async (cepInformado: string): Promise<ValidarCepResult> => {
    const cep = String(cepInformado ?? '').replace(/\D/g, '');

    if (cep.length !== 8) {
      return bloquearCep('CEP_INVALIDO', 'CEP inválido. Informe um CEP com 8 dígitos.');
    }

    let viaCep: ViaCepResponse;
    try {
      const response = await axios.get<ViaCepResponse>(`https://viacep.com.br/ws/${cep}/json/`, {
        timeout: 8000,
      });
      viaCep = response.data;
    } catch (error) {
      console.error('Erro ao consultar ViaCEP:', error);
      return bloquearCep('ERRO_CONSULTA_CEP', 'Não foi possível consultar o CEP no momento.');
    }

    if (!viaCep || viaCep.erro) {
      return bloquearCep('CEP_NAO_ENCONTRADO', 'CEP não encontrado.');
    }

    const estado = String(viaCep.uf ?? '').trim();
    const cidade = String(viaCep.localidade ?? '').trim();
    const bairro = String(viaCep.bairro ?? '').trim();
    const logradouro = String(viaCep.logradouro ?? '').trim();

    if (!estado || !cidade || !bairro) {
      return bloquearCep(
        'BAIRRO_NAO_IDENTIFICADO',
        'Não foi possível identificar cidade, estado e bairro para este CEP.'
      );
    }

    const enderecoCatalogo = LocalidadesService.validarEndereco(estado, cidade, bairro);
    if (!enderecoCatalogo) {
      return bloquearCep('BAIRRO_FORA_DO_CATALOGO', 'O bairro identificado não está no catálogo oficial.');
    }

    const conselho = await conselhoRepo.encontrarPorEndereco(
      enderecoCatalogo.cidade,
      enderecoCatalogo.estado,
      enderecoCatalogo.bairro
    );

    if (!conselho) {
      return bloquearCep('CONSELHO_NAO_CADASTRADO', 'Não existe conselho tutelar cadastrado para este bairro.');
    }

    return {
      podeProsseguir: true,
      endereco: {
        cep,
        estado: enderecoCatalogo.estado,
        cidade: enderecoCatalogo.cidade,
        bairro: enderecoCatalogo.bairro,
        logradouro,
        rua: logradouro,
      },
      conselho: {
        id: conselho.id!,
        nome: conselho.nome,
      },
    };
  };

  const enviarDenuncia = async (body: EnviarDenunciaRequest) => {
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

    const cidade = normalizarTextoObrigatorio(body.cidade, 'cidade');
    const estado = normalizarTextoObrigatorio(body.estado, 'estado').toUpperCase();
    const bairro = normalizarTextoObrigatorio(body.bairro, 'bairro');
    const enderecoCatalogo = LocalidadesService.validarEndereco(estado, cidade, bairro);

    if (!enderecoCatalogo) {
      throw new Error('Bairro fora do catálogo oficial.');
    }

    const conselho = await conselhoRepo.encontrarPorEndereco(
      enderecoCatalogo.cidade,
      enderecoCatalogo.estado,
      enderecoCatalogo.bairro
    );

    if (!conselho) {
      throw new Error('Conselho tutelar não encontrado para cidade, estado e bairro informados.');
    }

    const emailDestino = conselho.email;

    const protocolo = gerarProtocolo();

    const subject = 'Nova Denúncia Recebida - ProtegeSaúde';
    const emailBody = `
    Prezados,

    Uma nova denúncia foi registrada no sistema ProtegeSaúde.

    Protocolo: ${protocolo}
    Data: ${new Date().toLocaleDateString('pt-BR')}
    Hora: ${new Date().toLocaleTimeString('pt-BR')}

    Esta é uma mensagem automática. Por favor, não responda a este e-mail.

    Atenciosamente,
    Equipe ProtegeSaúde
    `;

    const attachments = [];

    if (body.pdf) {
      attachments.push({
        filename: body.pdf.originalname,
        content: body.pdf.buffer,
      });
    }

    let mailStart = 0;

    try {
      mailStart = Date.now();
      //logparaeficientedadenuncia
      console.log('[denuncia] smtp_send_start', {
        protocolo,
        to: emailDestino,
        attachmentBytes: body.pdf.size,
      });

      const info = await transporter.sendMail({
        from: process.env.ODONTO_GUARDIAO_EMAIL,
        to: emailDestino,
        subject,
        text: emailBody,
        attachments,
      });

      //logparaeficientedadenuncia
      console.log('[denuncia] smtp_send_done', {
        protocolo,
        durationMs: Date.now() - mailStart,
        response: info.response,
      });

      await denunciaRepo.criar({
        protocolo,
        regiao: body.regiao ?? '',
        profissao_id: body.profissao_id,
        conselho_tutelar_id: conselho.id,
        cidade: enderecoCatalogo.cidade,
        estado: enderecoCatalogo.estado,
        bairro: enderecoCatalogo.bairro,
      })

      console.log(`Email enviado: ${info.response}`);
      return { success: true, protocolo, message: 'Denúncia enviada com sucesso.' };
    } catch (error) {
      //logparaeficientedadenuncia
      console.error('[denuncia] smtp_send_error', {
        protocolo,
        durationMs: mailStart ? Date.now() - mailStart : null,
        code: (error as any)?.code,
        command: (error as any)?.command,
        message: (error as any)?.message,
      });
      console.error('Erro ao enviar denúncia:', error);
      throw formatarErroEnvioEmail(error);
    }
  }

  const listaTodasDenuncias = async () => {
    return await denunciaRepo.listarTodas()
  }

  return {
    validarCep,
    enviarDenuncia,
    listaTodasDenuncias
  }
}

function formatarErroEnvioEmail(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error('Erro ao enviar denúncia.');
  }

  const smtpError = error as Error & { code?: string; command?: string };

  if (smtpError.code === 'ETIMEDOUT' && smtpError.command === 'CONN') {
    return new Error(
      `Falha ao conectar ao servidor SMTP (${smtpConfig.host}:${smtpConfig.port}, secure=${String(
        smtpConfig.secure
      )}). Verifique SMTP_HOST/SMTP_PORT/SMTP_SECURE e se o ambiente permite saída para o provedor de e-mail.`
    );
  }

  if (smtpError.code === 'EAUTH') {
    return new Error('Falha de autenticação no servidor SMTP. Verifique ODONTO_GUARDIAO_EMAIL e ODONTO_GUARDIAO_PWD.');
  }

  return error;
}
