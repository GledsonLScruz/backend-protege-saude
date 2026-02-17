import { Request, Response } from 'express';
import { DocumentoUploadFiles } from './@types';
import { AtualizarDocumentoRequest, CriarDocumentoRequest } from './dto';
import { DocumentoService } from './documento-service';

const extrairArquivos = (req: Request): DocumentoUploadFiles => {
  if (!req.files) return {};

  if (Array.isArray(req.files)) {
    return {
      arquivo: req.files.find((file) => file.fieldname === 'arquivo'),
      foto_capa: req.files.find((file) => file.fieldname === 'foto_capa'),
    };
  }

  const arquivosAgrupados = req.files as { [fieldname: string]: Express.Multer.File[] };
  return {
    arquivo: arquivosAgrupados.arquivo?.[0],
    foto_capa: arquivosAgrupados.foto_capa?.[0],
  };
};

const statusPorErro = (message: string): number => {
  if (message.includes('não encontrada') || message.includes('não encontrado')) return 404;
  if (message.includes('não é possível')) return 400;
  if (message.includes('PDF') || message.includes('imagem')) return 415;
  if (message.includes('inválid') || message.includes('obrigatório') || message.includes('Informe')) return 400;
  return 500;
};

export const listarDocumentosPorProfissao = async (req: Request, res: Response) => {
  const service = await DocumentoService();
  const profissaoId = Number(req.params.profissaoId);

  if (Number.isNaN(profissaoId)) {
    return res.status(400).json({ error: 'Profissão inválida' });
  }

  try {
    const documentos = await service.listarPorProfissao(profissaoId);
    return res.status(200).json(documentos);
  } catch (error: any) {
    const message = error?.message || 'Erro ao listar documentos';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const buscarDocumentoPorId = async (req: Request, res: Response) => {
  const service = await DocumentoService();
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const documento = await service.buscarPorId(id);
    return res.status(200).json(documento);
  } catch (error: any) {
    const message = error?.message || 'Erro ao buscar documento';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const criarDocumento = async (req: Request, res: Response) => {
  const service = await DocumentoService();
  const files = extrairArquivos(req);

  try {
    const dto = CriarDocumentoRequest.from(req.body);
    const documento = await service.criar(dto, files);
    return res.status(201).json(documento);
  } catch (error: any) {
    const message = error?.message || 'Erro ao criar documento';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const atualizarDocumento = async (req: Request, res: Response) => {
  const service = await DocumentoService();
  const id = Number(req.params.id);
  const files = extrairArquivos(req);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const dto = AtualizarDocumentoRequest.from(req.body);
    const documento = await service.atualizar(id, dto, files);
    return res.status(200).json(documento);
  } catch (error: any) {
    const message = error?.message || 'Erro ao atualizar documento';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const removerDocumento = async (req: Request, res: Response) => {
  const service = await DocumentoService();
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    await service.deletar(id);
    return res.status(200).json({ message: 'Documento removido com sucesso' });
  } catch (error: any) {
    const message = error?.message || 'Erro ao remover documento';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};
