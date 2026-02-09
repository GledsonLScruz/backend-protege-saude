import { AtualizarProfissaoDTO, CriarProfissaoDTO, Profissao } from './@types';
import { ProfissaoRepository } from './profissao-repository';
import db from '../../database/db';

export const ProfissaoService = async () => {
  const database = await db;
  const repo = new ProfissaoRepository(database);

  const validarDados = (data: CriarProfissaoDTO | AtualizarProfissaoDTO, isCreate: boolean) => {
    if (isCreate) {
      if (!data.nome?.trim()) throw new Error('Nome é obrigatório');
      if (!data.descricao?.trim()) throw new Error('Descrição é obrigatória');
      if (!data.cor?.trim()) throw new Error('Cor é obrigatória');
    }
    if (data.status !== undefined && ![0, 1].includes(data.status)) {
      throw new Error('Status deve ser 0 ou 1');
    }
  };

  const listar = async (): Promise<Profissao[]> => {
    return repo.listar();
  };

  const criar = async (payload: CriarProfissaoDTO): Promise<Profissao> => {
    validarDados(payload, true);
    try {
      return await repo.criar(payload);
    } catch (err: any) {
      if (err?.code === 'SQLITE_CONSTRAINT') {
        throw new Error('Já existe uma profissão com esse nome');
      }
      throw err;
    }
  };

  const atualizar = async (id: number, payload: AtualizarProfissaoDTO): Promise<Profissao> => {
    validarDados(payload, false);

    try {
      const atualizado = await repo.atualizar(id, payload);
      if (!atualizado) {
        throw new Error('Profissão não encontrada');
      }
      return atualizado;
    } catch (err: any) {
      if (err?.code === 'SQLITE_CONSTRAINT') {
        throw new Error('Já existe uma profissão com esse nome');
      }
      throw err;
    }
  };

  const alterarStatus = async (id: number, status: number): Promise<Profissao> => {
    if (![0, 1].includes(status)) throw new Error('Status deve ser 0 ou 1');
    const atualizado = await repo.alterarStatus(id, status);
    if (!atualizado) throw new Error('Profissão não encontrada');
    return atualizado;
  };

  return {
    listar,
    criar,
    atualizar,
    alterarStatus,
  };
};
