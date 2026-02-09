import { Request, Response } from 'express';
import { ProfissaoService } from './profissao-service';
import { AtualizarProfissaoRequest, CriarProfissaoRequest } from './dto';

export const listarProfissoes = async (_req: Request, res: Response) => {
  const service = await ProfissaoService();
  try {
    const profissoes = await service.listar();
    return res.json(profissoes);
  } catch (error) {
    console.error('Erro ao listar profissões:', error);
    return res.status(500).json({ error: 'Erro ao listar profissões' });
  }
};

export const criarProfissao = async (req: Request, res: Response) => {
  const service = await ProfissaoService();
  try {
    const dto = CriarProfissaoRequest.from(req.body);
    const criada = await service.criar(dto);
    return res.status(201).json(criada);
  } catch (error: any) {
    const message = error?.message || 'Erro ao criar profissão';
    const status = message.includes('encontrada') ? 404 : message.includes('existe') ? 409 : 400;
    return res.status(status).json({ error: message });
  }
};

export const atualizarProfissao = async (req: Request, res: Response) => {
  const service = await ProfissaoService();
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const dto = AtualizarProfissaoRequest.from(req.body);
    const atualizada = await service.atualizar(id, dto);
    return res.json(atualizada);
  } catch (error: any) {
    const message = error?.message || 'Erro ao atualizar profissão';
    let status = 400;
    if (message.includes('não encontrada')) status = 404;
    else if (message.includes('existe')) status = 409;
    return res.status(status).json({ error: message });
  }
};
