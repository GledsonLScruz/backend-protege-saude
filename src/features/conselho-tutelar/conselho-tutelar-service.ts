import db from '../../database/db';
import { AtualizarConselhoTutelarDTO, ConselhoTutelar, CriarConselhoTutelarDTO } from './@types';
import { ConselhoTutelarRepository } from './conselho-tutelar-repository';
import { LocalidadesService, normalizarBuscaLocalidade } from '../localidades/localidades-service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizarTextoObrigatorio = (value: string, nomeCampo: string): string => {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(`${nomeCampo} é obrigatório`);
  return normalized;
};

const normalizarBairros = (bairros: string[]): string[] => {
  if (!Array.isArray(bairros)) throw new Error('bairros deve ser um array');

  const normalizados = bairros.map((bairro) => bairro.trim()).filter(Boolean);
  if (normalizados.length === 0) throw new Error('bairros deve conter ao menos um item');

  const vistos = new Set<string>();

  for (const bairro of normalizados) {
    const chave = normalizarBuscaLocalidade(bairro);
    if (vistos.has(chave)) throw new Error('bairros possui item duplicado');
    vistos.add(chave);
  }

  return normalizados;
};

export const ConselhoTutelarService = async () => {
  const database = await db;
  const repository = new ConselhoTutelarRepository(database);

  const listar = async (): Promise<ConselhoTutelar[]> => {
    return repository.findAll();
  };

  const buscarPorId = async (id: number): Promise<ConselhoTutelar | undefined> => {
    if (!Number.isInteger(id) || id <= 0) throw new Error('ID inválido');
    return repository.findById(id);
  };

  const buscarPorCidade = async (cidade: string): Promise<ConselhoTutelar | undefined> => {
    const cidadeNormalizada = normalizarTextoObrigatorio(cidade, 'cidade');
    return repository.findByCidade(cidadeNormalizada);
  };

  const buscarPorEndereco = async (cidade: string, estado: string, bairro: string): Promise<ConselhoTutelar | undefined> => {
    const cidadeNormalizada = normalizarTextoObrigatorio(cidade, 'cidade');
    const estadoNormalizado = normalizarTextoObrigatorio(estado, 'estado').toUpperCase();
    const bairroNormalizado = normalizarTextoObrigatorio(bairro, 'bairro');
    return repository.encontrarPorEndereco(cidadeNormalizada, estadoNormalizado, bairroNormalizado);
  };

  const pesquisar = async (termo: string): Promise<ConselhoTutelar[]> => {
    const termoNormalizado = normalizarTextoObrigatorio(termo, 'termo');
    return repository.search(termoNormalizado);
  };

  const validarPayload = async (
    payload: CriarConselhoTutelarDTO | AtualizarConselhoTutelarDTO,
    ignorarConselhoId?: number
  ): Promise<CriarConselhoTutelarDTO> => {
    const nome = normalizarTextoObrigatorio(payload.nome, 'nome');
    const email = normalizarTextoObrigatorio(payload.email, 'email');
    const cidadeInformada = normalizarTextoObrigatorio(payload.cidade, 'cidade');
    const estadoInformado = normalizarTextoObrigatorio(payload.estado, 'estado').toUpperCase();
    const bairros = normalizarBairros(payload.bairros);

    if (!EMAIL_REGEX.test(email)) throw new Error('email inválido');

    const estado = LocalidadesService.resolverEstado(estadoInformado);
    if (!estado) throw new Error('estado inválido');

    const cidade = LocalidadesService.resolverCidade(estado, cidadeInformada);
    if (!cidade) throw new Error('cidade inválida para o estado informado');

    const bairrosCatalogo = bairros.map((bairro) => {
      const bairroCatalogo = LocalidadesService.resolverBairro(estado, cidade, bairro);
      if (!bairroCatalogo) throw new Error(`bairro inválido para a cidade informada: ${bairro}`);
      return bairroCatalogo;
    });

    for (const bairro of bairrosCatalogo) {
      const conselhoExistente = await repository.bairroJaVinculado(cidade, estado, bairro, ignorarConselhoId);
      if (conselhoExistente) {
        throw new Error(`bairro já vinculado ao conselho ${conselhoExistente.nome}`);
      }
    }

    return { nome, email, cidade, estado, bairros: bairrosCatalogo };
  };

  const criar = async (payload: CriarConselhoTutelarDTO): Promise<ConselhoTutelar> => {
    const data = await validarPayload(payload);
    return repository.criar(data);
  };

  const atualizar = async (id: number, payload: AtualizarConselhoTutelarDTO): Promise<ConselhoTutelar> => {
    if (!Number.isInteger(id) || id <= 0) throw new Error('ID inválido');

    const atual = await repository.findById(id);
    if (!atual) throw new Error('Conselho tutelar não encontrado');

    const data = await validarPayload(payload, id);
    const atualizado = await repository.atualizar(id, data);
    if (!atualizado) throw new Error('Conselho tutelar não encontrado');

    return atualizado;
  };

  const deletar = async (id: number): Promise<void> => {
    if (!Number.isInteger(id) || id <= 0) throw new Error('ID inválido');

    const removido = await repository.deletar(id);
    if (!removido) throw new Error('Conselho tutelar não encontrado');
  };

  return {
    listar,
    buscarPorId,
    buscarPorCidade,
    buscarPorEndereco,
    pesquisar,
    criar,
    atualizar,
    deletar,
  };
};
