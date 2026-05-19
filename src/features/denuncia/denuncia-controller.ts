import { Request, Response } from 'express';
import { upload } from '../../integration/multer';
import { EnviarDenunciaRequest } from './@types';
import { DenunciaService } from './denuncia-service';

export const validarCepDenuncia = async (req: Request, res: Response) => {
  const service = await DenunciaService();

  try {
    const result = await service.validarCep(req.params.cep);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao validar CEP:', error);
    return res.status(200).json({
      podeProsseguir: false,
      codigo: 'ERRO_CONSULTA_CEP',
      mensagem: 'Não foi possível consultar o CEP no momento.',
    });
  }
};

export const criarDenuncia = async (req: Request, res: Response) => {
  const service = await DenunciaService()

  const denuncia = req.body as Partial<EnviarDenunciaRequest>;
  const pdf = req.file;
  const profissaoId = Number(req.body?.profissao_id);

  if (!Number.isInteger(profissaoId) || profissaoId <= 0) {
    return res.status(400).json({ error: 'O campo "profissao_id" é obrigatório e deve ser válido.' });
  }

  const cidade = String(req.body?.cidade ?? '').trim();
  const estado = String(req.body?.estado ?? '').trim();
  const bairro = String(req.body?.bairro ?? '').trim();

  if (!cidade) {
    return res.status(400).json({ error: 'O campo "cidade" é obrigatório.' });
  }

  if (!estado) {
    return res.status(400).json({ error: 'O campo "estado" é obrigatório.' });
  }

  if (!bairro) {
    return res.status(400).json({ error: 'O campo "bairro" é obrigatório.' });
  }

  if (!pdf) {
    return res.status(400).json({ error: 'O arquivo PDF é obrigatório.' });
  }

  try {
    const result = await service.enviarDenuncia({
      protocolo: denuncia.protocolo ?? '',
      regiao: denuncia.regiao,
      profissao_id: profissaoId,
      cidade,
      estado,
      bairro,
      pdf,
    });
    return res.status(201).json({ message: result.message, protocolo: result.protocolo });
  } catch (error: any) {
    const message = error?.message || 'Erro ao enviar denúncia.';
    let status = 500;
    if (
      message.includes('obrigatório') ||
      message.includes('inválida') ||
      message.includes('inválido') ||
      message.includes('inativa') ||
      message.includes('catálogo')
    ) {
      status = 400;
    } else if (message.includes('não encontrado') || message.includes('não encontrada')) {
      status = 404;
    }
    return res.status(status).json({ error: message });
  }
};

export const listaTodasDenuncias = async (req: Request, res: Response) => {
  const service = await DenunciaService()
  
  try {
    const denuncias = await service.listaTodasDenuncias()
    return res.status(200).json(denuncias)
  } catch (err) {
    console.error('Erro ao listar denúncias:', err);
    return res.status(500).json({ error: 'Erro ao listar denúncias.' });
  }
}

export const criarDenunciaRoute = upload.single('pdf');
