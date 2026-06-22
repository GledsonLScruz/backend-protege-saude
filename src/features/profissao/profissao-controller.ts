import { Request, Response } from 'express';
import { ProfissaoService } from './profissao-service';
import {
  AtualizarProfissaoRequest,
  ClonarProfissaoRequest,
  CriarProfissaoRequest,
  ImportarConteudoProfissaoRequest,
} from './dto';

const obterUsuarioAdminId = (req: Request): number | undefined => req.usuarioAutenticado?.id;

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

export const listarProfissoesPublicas = async (_req: Request, res: Response) => {
  const service = await ProfissaoService();
  try {
    const profissoes = await service.listarAtivas();
    return res.json(profissoes);
  } catch (error) {
    console.error('Erro ao listar profissões públicas:', error);
    return res.status(500).json({ error: 'Erro ao listar profissões públicas' });
  }
};

export const buscarProfissao = async (req: Request, res: Response) => {
  const service = await ProfissaoService();
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const profissao = await service.buscarPorId(id);
    return res.json(profissao);
  } catch (error: any) {
    const message = error?.message || 'Erro ao buscar profissão';
    const status = message.includes('inválido') ? 400 : message.includes('não encontrada') ? 404 : 500;
    return res.status(status).json({ error: message });
  }
};

export const criarProfissao = async (req: Request, res: Response) => {
  const service = await ProfissaoService();
  const usuarioAdminId = obterUsuarioAdminId(req);
  if (!usuarioAdminId) return res.status(401).json({ error: 'Usuário autenticado inválido' });

  try {
    const dto = CriarProfissaoRequest.from(req.body);
    const criada = await service.criar(dto, usuarioAdminId);
    return res.status(201).json(criada);
  } catch (error: any) {
    const message = error?.message || 'Erro ao criar profissão';
    const status = message.includes('encontrada') ? 404 : message.includes('existe') ? 409 : 400;
    return res.status(status).json({ error: message });
  }
};

export const clonarProfissao = async (req: Request, res: Response) => {
  const service = await ProfissaoService();
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const usuarioAdminId = obterUsuarioAdminId(req);
  if (!usuarioAdminId) return res.status(401).json({ error: 'Usuário autenticado inválido' });

  try {
    const dto = ClonarProfissaoRequest.from(req.body);
    const resultado = await service.clonar(id, dto, usuarioAdminId);
    return res.status(201).json(resultado);
  } catch (error: any) {
    console.error('Erro ao clonar profissão:', error);
    const message = error?.message || 'Erro ao clonar profissão';
    let status = 500;
    if (message.includes('inválido') || message.includes('booleano')) status = 400;
    else if (message.includes('não encontrada')) status = 404;
    return res.status(status).json({ error: message });
  }
};

export const importarConteudoProfissao = async (req: Request, res: Response) => {
  const service = await ProfissaoService();
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const usuarioAdminId = obterUsuarioAdminId(req);
  if (!usuarioAdminId) return res.status(401).json({ error: 'Usuário autenticado inválido' });

  try {
    const dto = ImportarConteudoProfissaoRequest.from(req.body);
    const resultado = await service.importarConteudo(id, dto, usuarioAdminId);
    return res.status(201).json(resultado);
  } catch (error: any) {
    console.error('Erro ao importar conteúdo da profissão:', error);
    const message = error?.message || 'Erro ao importar conteúdo da profissão';
    let status = 500;
    if (message.includes('inválido') || message.includes('booleano') || message.includes('Informe')) status = 400;
    else if (message.includes('não encontrada')) status = 404;
    return res.status(status).json({ error: message });
  }
};

export const atualizarProfissao = async (req: Request, res: Response) => {
  const service = await ProfissaoService();
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  const usuarioAdminId = obterUsuarioAdminId(req);
  if (!usuarioAdminId) return res.status(401).json({ error: 'Usuário autenticado inválido' });

  try {
    const dto = AtualizarProfissaoRequest.from(req.body);
    const atualizada = await service.atualizar(id, dto, usuarioAdminId);
    return res.json(atualizada);
  } catch (error: any) {
    const message = error?.message || 'Erro ao atualizar profissão';
    let status = 400;
    if (message.includes('não encontrada')) status = 404;
    else if (message.includes('existe')) status = 409;
    return res.status(status).json({ error: message });
  }
};

export const removerProfissao = async (req: Request, res: Response) => {
  const service = await ProfissaoService();
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    await service.deletar(id);
    return res.status(200).json({ message: 'Profissão removida com sucesso' });
  } catch (error: any) {
    const message = error?.message || 'Erro ao remover profissão';
    const status = message.includes('inválido') ? 400 : message.includes('não encontrada') ? 404 : 500;
    return res.status(status).json({ error: message });
  }
};
