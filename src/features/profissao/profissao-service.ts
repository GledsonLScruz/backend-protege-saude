import {
  AtualizarProfissaoDTO,
  ClonarProfissaoDTO,
  ClonarProfissaoResultado,
  CriarProfissaoDTO,
  ImportarConteudoProfissaoDTO,
  ImportarConteudoProfissaoResultado,
  Profissao,
} from './@types';
import { ProfissaoRepository } from './profissao-repository';
import db from '../../database/db';
import {
  caminhoPublicoParaAbsoluto,
  garantirDiretoriosDocumento,
  removerArquivoSeExistir,
} from '../documento/documento-file-utils';

export const ProfissaoService = async () => {
  garantirDiretoriosDocumento();
  const database = await db;
  const repo = new ProfissaoRepository(database);

  const validarDados = (data: CriarProfissaoDTO | AtualizarProfissaoDTO, isCreate: boolean) => {
    if (isCreate) {
      if (!data.nome?.trim()) throw new Error('Nome é obrigatório');
      if (!data.cor?.trim()) throw new Error('Cor é obrigatória');
    }
    if (data.status !== undefined && ![0, 1].includes(data.status)) {
      throw new Error('Status deve ser 0 ou 1');
    }
  };

  const validarIdPositivo = (id: number, fieldName = 'ID') => {
    if (!Number.isInteger(id) || id <= 0) throw new Error(`${fieldName} inválido`);
  };

  const listar = async (): Promise<Profissao[]> => {
    return repo.listar();
  };

  const listarAtivas = async (): Promise<Profissao[]> => {
    return repo.listarAtivas();
  };

  const buscarPorId = async (id: number): Promise<Profissao> => {
    validarIdPositivo(id);

    const profissao = await repo.buscarPorId(id);
    if (!profissao) throw new Error('Profissão não encontrada');

    return profissao;
  };

  const buscarAtivaPorId = async (id: number): Promise<Profissao> => {
    validarIdPositivo(id);

    const profissao = await repo.buscarAtivaPorId(id);
    if (!profissao) throw new Error('Profissão não encontrada ou inativa');

    return profissao;
  };

  const criar = async (payload: CriarProfissaoDTO, usuarioAdminId: number): Promise<Profissao> => {
    validarDados(payload, true);
    try {
      const criada = await repo.criar(payload);
      await repo.registrarUltimoEditor(criada.id!, usuarioAdminId);
      return (await repo.buscarPorId(criada.id!))!;
    } catch (err: any) {
      if (err?.code === 'SQLITE_CONSTRAINT') {
        throw new Error('Já existe uma profissão com esse nome');
      }
      throw err;
    }
  };

  const atualizar = async (id: number, payload: AtualizarProfissaoDTO, usuarioAdminId: number): Promise<Profissao> => {
    validarDados(payload, false);

    try {
      const atualizado = await repo.atualizar(id, payload);
      if (!atualizado) {
        throw new Error('Profissão não encontrada');
      }
      await repo.registrarUltimoEditor(id, usuarioAdminId);
      return (await repo.buscarPorId(id))!;
    } catch (err: any) {
      if (err?.code === 'SQLITE_CONSTRAINT') {
        throw new Error('Já existe uma profissão com esse nome');
      }
      throw err;
    }
  };

  const alterarStatus = async (id: number, status: number, usuarioAdminId: number): Promise<Profissao> => {
    if (![0, 1].includes(status)) throw new Error('Status deve ser 0 ou 1');
    const atualizado = await repo.alterarStatus(id, status);
    if (!atualizado) throw new Error('Profissão não encontrada');
    await repo.registrarUltimoEditor(id, usuarioAdminId);
    return (await repo.buscarPorId(id))!;
  };

  const gerarNomeClone = async (nomeOriginal: string): Promise<string> => {
    const nomeBase = `${nomeOriginal} copia`;
    if (!(await repo.nomeExiste(nomeBase))) return nomeBase;

    let sufixo = 2;
    while (await repo.nomeExiste(`${nomeBase} ${sufixo}`)) {
      sufixo += 1;
    }

    return `${nomeBase} ${sufixo}`;
  };

  const clonar = async (
    id: number,
    payload: ClonarProfissaoDTO,
    usuarioAdminId: number
  ): Promise<ClonarProfissaoResultado> => {
    validarIdPositivo(id);

    const original = await repo.buscarPorId(id);
    if (!original) throw new Error('Profissão não encontrada');

    const nomeClone = await gerarNomeClone(original.nome);
    const resultado = await repo.clonar(
      original,
      nomeClone,
      payload.clonar_documentos ?? false,
      payload.clonar_formulario ?? false
    );

    await repo.registrarUltimoEditor(resultado.profissao.id!, usuarioAdminId);

    return {
      ...resultado,
      profissao: (await repo.buscarPorId(resultado.profissao.id!))!,
    };
  };

  const importarConteudo = async (
    profissaoDestinoId: number,
    payload: ImportarConteudoProfissaoDTO,
    usuarioAdminId: number
  ): Promise<ImportarConteudoProfissaoResultado> => {
    validarIdPositivo(profissaoDestinoId);
    validarIdPositivo(payload.profissao_origem_id, 'profissao_origem_id');

    const importarDocumentos = payload.importar_documentos ?? false;
    const importarFormulario = payload.importar_formulario ?? false;
    if (!importarDocumentos && !importarFormulario) {
      throw new Error('Informe importar_documentos ou importar_formulario');
    }

    const destino = await repo.buscarPorId(profissaoDestinoId);
    if (!destino) throw new Error('Profissão destino não encontrada');

    const origem = await repo.buscarPorId(payload.profissao_origem_id);
    if (!origem) throw new Error('Profissão origem não encontrada');

    const resultado = await repo.importarConteudo(
      origem.id!,
      destino.id!,
      importarDocumentos,
      importarFormulario
    );

    await repo.registrarUltimoEditor(destino.id!, usuarioAdminId);

    return {
      ...resultado,
      profissao: (await repo.buscarPorId(destino.id!))!,
    };
  };

  const deletar = async (id: number): Promise<void> => {
    validarIdPositivo(id);

    const documentos = await repo.deletarComDependencias(id);

    await Promise.all(
      documentos
        .flatMap((documento) => [documento.arquivo, documento.foto_capa])
        .filter((value): value is string => Boolean(value))
        .map((filePath) => removerArquivoSeExistir(caminhoPublicoParaAbsoluto(filePath)))
    );
  };

  return {
    listar,
    listarAtivas,
    buscarPorId,
    buscarAtivaPorId,
    criar,
    atualizar,
    alterarStatus,
    clonar,
    importarConteudo,
    deletar,
  };
};
