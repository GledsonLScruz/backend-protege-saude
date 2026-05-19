import { Request, Response } from 'express';
import { AtualizarConselhoTutelarRequest, CriarConselhoTutelarRequest } from './dto';
import { ConselhoTutelarService } from './conselho-tutelar-service';

const statusPorErro = (message: string): number => {
  if (message.includes('não encontrado') || message.includes('não encontrada')) return 404;
  if (message.includes('duplicado') || message.includes('já vinculado') || message.includes('UNIQUE')) return 409;
  if (message.includes('obrigatório') || message.includes('inválido') || message.includes('deve')) return 400;
  return 500;
};

export const listarConselhosTutelares = async (_req: Request, res: Response) => {
  const service = await ConselhoTutelarService();

  try {
    const conselhos = await service.listar();
    return res.status(200).json(conselhos);
  } catch (error) {
    console.error('Erro ao buscar conselhos tutelares:', error);
    return res.status(500).json({ error: 'Erro ao buscar conselhos tutelares' });
  }
};

export const buscarConselhoTutelarPorId = async (req: Request, res: Response) => {
  const service = await ConselhoTutelarService();
  const id = Number(req.params.id);

  try {
    const conselho = await service.buscarPorId(id);
    if (!conselho) return res.status(404).json({ error: 'Conselho tutelar não encontrado' });
    return res.status(200).json(conselho);
  } catch (error: any) {
    const message = error?.message || 'Erro ao buscar conselho tutelar';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const buscarConselhoTutelarPorCidade = async (req: Request, res: Response) => {
  const service = await ConselhoTutelarService();

  try {
    const conselho = await service.buscarPorCidade(req.params.cidade);
    if (!conselho) return res.status(404).json({ error: 'Conselho tutelar não encontrado para esta cidade' });
    return res.status(200).json(conselho);
  } catch (error: any) {
    const message = error?.message || 'Erro ao buscar conselho tutelar';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const pesquisarConselhosTutelares = async (req: Request, res: Response) => {
  const service = await ConselhoTutelarService();
  const termo = req.query.termo;

  if (!termo || typeof termo !== 'string') {
    return res.status(400).json({ error: 'Termo de busca é obrigatório' });
  }

  try {
    const resultados = await service.pesquisar(termo);
    return res.status(200).json(resultados);
  } catch (error: any) {
    const message = error?.message || 'Erro ao realizar busca';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const criarConselhoTutelar = async (req: Request, res: Response) => {
  const service = await ConselhoTutelarService();

  try {
    const dto = CriarConselhoTutelarRequest.from(req.body);
    const conselho = await service.criar(dto);
    return res.status(201).json(conselho);
  } catch (error: any) {
    const message = error?.message || 'Erro ao criar conselho tutelar';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const atualizarConselhoTutelar = async (req: Request, res: Response) => {
  const service = await ConselhoTutelarService();
  const id = Number(req.params.id);

  try {
    const dto = AtualizarConselhoTutelarRequest.from(req.body);
    const conselho = await service.atualizar(id, dto);
    return res.status(200).json(conselho);
  } catch (error: any) {
    const message = error?.message || 'Erro ao atualizar conselho tutelar';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const removerConselhoTutelar = async (req: Request, res: Response) => {
  const service = await ConselhoTutelarService();
  const id = Number(req.params.id);

  try {
    await service.deletar(id);
    return res.status(200).json({ message: 'Conselho tutelar removido com sucesso' });
  } catch (error: any) {
    const message = error?.message || 'Erro ao remover conselho tutelar';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};
