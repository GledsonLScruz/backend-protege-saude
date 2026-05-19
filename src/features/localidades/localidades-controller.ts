import { Request, Response } from 'express';
import { LocalidadesService } from './localidades-service';

const statusPorErro = (message: string): number => {
  if (message.includes('inválido') || message.includes('obrigatório')) return 400;
  return 500;
};

const queryStringObrigatoria = (value: unknown, nomeCampo: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${nomeCampo} é obrigatório`);
  }
  return value.trim();
};

export const listarEstados = (_req: Request, res: Response) => {
  return res.status(200).json(LocalidadesService.listarEstados());
};

export const listarCidades = (req: Request, res: Response) => {
  try {
    const estado = queryStringObrigatoria(req.query.estado, 'estado');
    return res.status(200).json(LocalidadesService.listarCidades(estado));
  } catch (error: any) {
    const message = error?.message || 'Erro ao listar cidades';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};

export const listarBairros = (req: Request, res: Response) => {
  try {
    const estado = queryStringObrigatoria(req.query.estado, 'estado');
    const cidade = queryStringObrigatoria(req.query.cidade, 'cidade');
    return res.status(200).json(LocalidadesService.listarBairros(estado, cidade));
  } catch (error: any) {
    const message = error?.message || 'Erro ao listar bairros';
    return res.status(statusPorErro(message)).json({ error: message });
  }
};
