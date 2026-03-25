import { Request, Response } from 'express';
import {
  AtualizarFormularioCampoRequest,
  AtualizarFormularioPassoRequest,
  CriarFormularioCampoRequest,
  CriarFormularioPassoRequest,
  ReorderFormularioCampoRequest,
  ReorderFormularioPassoRequest,
} from './dto';
import { FormularioService } from './formulario-service';

const statusPorErro = (message: string): number => {
  if (message.includes('não encontrada') || message.includes('não encontrado')) return 404;
  if (message.includes('já utilizado') || message.includes('duplicado')) return 409;
  if (
    message.includes('inválid') ||
    message.includes('inativa') ||
    message.includes('obrigatório') ||
    message.includes('sequencial') ||
    message.includes('permitida') ||
    message.includes('deve') ||
    message.includes('incluir todos')
  ) {
    return 400;
  }
  return 500;
};

export const listarPassosFormularioPorProfissao = async (req: Request, res: Response) => {
  const service = await FormularioService();
  const profissaoId = Number(req.params.profissaoId);

  if (Number.isNaN(profissaoId)) {
    return res.status(400).json({ error: 'Profissão inválida' });
  }

  try {
    const passos = await service.listarPassosPorProfissao(profissaoId);
    return res.status(200).json(passos);
  } catch (error: any) {
    const message = error?.message || 'Erro ao listar passos do formulário';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const obterFormularioPublicoPorProfissao = async (req: Request, res: Response) => {
  const service = await FormularioService();
  const profissaoId = Number(req.params.profissaoId);

  if (Number.isNaN(profissaoId)) {
    return res.status(400).json({ error: 'Profissão inválida' });
  }

  try {
    const formulario = await service.obterFormularioPublicoPorProfissao(profissaoId);
    return res.status(200).json(formulario);
  } catch (error: any) {
    const message = error?.message || 'Erro ao carregar formulário público';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const criarPassoFormulario = async (req: Request, res: Response) => {
  const service = await FormularioService();

  try {
    const dto = CriarFormularioPassoRequest.from(req.body, req.params.profissaoId);
    const passo = await service.criarPasso(dto);
    return res.status(201).json(passo);
  } catch (error: any) {
    const message = error?.message || 'Erro ao criar passo do formulário';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const atualizarPassoFormulario = async (req: Request, res: Response) => {
  const service = await FormularioService();
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const dto = AtualizarFormularioPassoRequest.from(req.body);
    const passo = await service.atualizarPasso(id, dto);
    return res.status(200).json(passo);
  } catch (error: any) {
    const message = error?.message || 'Erro ao atualizar passo do formulário';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const removerPassoFormulario = async (req: Request, res: Response) => {
  const service = await FormularioService();
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    await service.deletarPasso(id);
    return res.status(200).json({ message: 'Passo removido com sucesso' });
  } catch (error: any) {
    const message = error?.message || 'Erro ao remover passo do formulário';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const reorderPassosFormulario = async (req: Request, res: Response) => {
  const service = await FormularioService();

  try {
    const dto = ReorderFormularioPassoRequest.from(req.body);
    const passos = await service.reorderPassos(dto);
    return res.status(200).json(passos);
  } catch (error: any) {
    const message = error?.message || 'Erro ao reordenar passos do formulário';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const listarCamposFormularioPorPasso = async (req: Request, res: Response) => {
  const service = await FormularioService();
  const passoId = Number(req.params.passoId);

  if (Number.isNaN(passoId)) {
    return res.status(400).json({ error: 'Passo inválido' });
  }

  try {
    const campos = await service.listarCamposPorPasso(passoId);
    return res.status(200).json(campos);
  } catch (error: any) {
    const message = error?.message || 'Erro ao listar campos do formulário';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const listarTiposCampoFormulario = async (_req: Request, res: Response) => {
  const service = await FormularioService();

  try {
    const tipos = await service.listarTiposCampo();
    return res.status(200).json(tipos);
  } catch (error: any) {
    const message = error?.message || 'Erro ao listar tipos de campo do formulário';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const criarCampoFormulario = async (req: Request, res: Response) => {
  const service = await FormularioService();

  try {
    const dto = CriarFormularioCampoRequest.from(req.body, req.params.passoId);
    const campo = await service.criarCampo(dto);
    return res.status(201).json(campo);
  } catch (error: any) {
    const message = error?.message || 'Erro ao criar campo do formulário';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const atualizarCampoFormulario = async (req: Request, res: Response) => {
  const service = await FormularioService();
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const dto = AtualizarFormularioCampoRequest.from(req.body);
    const campo = await service.atualizarCampo(id, dto);
    return res.status(200).json(campo);
  } catch (error: any) {
    const message = error?.message || 'Erro ao atualizar campo do formulário';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const removerCampoFormulario = async (req: Request, res: Response) => {
  const service = await FormularioService();
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    await service.deletarCampo(id);
    return res.status(200).json({ message: 'Campo removido com sucesso' });
  } catch (error: any) {
    const message = error?.message || 'Erro ao remover campo do formulário';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const reorderCamposFormulario = async (req: Request, res: Response) => {
  const service = await FormularioService();

  try {
    const dto = ReorderFormularioCampoRequest.from(req.body);
    const campos = await service.reorderCampos(dto);
    return res.status(200).json(campos);
  } catch (error: any) {
    const message = error?.message || 'Erro ao reordenar campos do formulário';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};
