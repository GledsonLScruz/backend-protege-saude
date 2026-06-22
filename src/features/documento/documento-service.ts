import fs from 'fs';
import path from 'path';
import db from '../../database/db';
import {
  AtualizarDocumentoDTO,
  CriarDocumentoDTO,
  Documento,
  DocumentoUploadFiles,
  ReorderDocumentoDTO,
} from './@types';
import { DocumentoRepository } from './documento-repository';
import {
  caminhoPublicoParaAbsoluto,
  garantirDiretoriosDocumento,
  montarCaminhosDocumento,
  montarCaminhosFotoCapa,
  removerArquivoSeExistir,
} from './documento-file-utils';
import { ProfissaoRepository } from '../profissao/profissao-repository';

const validarIdPositivo = (id: number, nomeCampo: string) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${nomeCampo} inválido`);
  }
};

const validarOrdemIndex = (ordemIndex: number, nomeCampo = 'ordem_index') => {
  if (!Number.isInteger(ordemIndex) || ordemIndex <= 0) {
    throw new Error(`${nomeCampo} inválido`);
  }
};

const paraTextoOpcionalNulo = (value: string | undefined | null): string | null => {
  if (value === undefined || value === null) return null;
  const texto = value.trim();
  return texto.length ? texto : null;
};

const obterNomeOriginal = (arquivo?: Express.Multer.File): string => arquivo?.originalname ?? '';

const validarUrlOnline = (url: string) => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (_error) {
    throw new Error('URL online inválida');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('URL online inválida');
  }
};

const validarArquivoPdf = (arquivo?: Express.Multer.File) => {
  if (!arquivo) return;

  const mimeType = (arquivo.mimetype || '').toLowerCase();
  const ext = path.extname(arquivo.originalname || '').toLowerCase();

  if (!mimeType.includes('pdf') && ext !== '.pdf') {
    throw new Error('Arquivo deve ser um PDF');
  }
};

const validarImagem = (arquivo?: Express.Multer.File) => {
  if (!arquivo) return;
  const mimeType = (arquivo.mimetype || '').toLowerCase();
  if (!mimeType.startsWith('image/')) {
    throw new Error('Foto de capa deve ser uma imagem válida');
  }
};

const normalizarItensReorder = (itens: { id: number; ordem_index: number }[]) => {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new Error('itens de reorder é obrigatório');
  }

  const ids = new Set<number>();
  const ordens = new Set<number>();

  for (const item of itens) {
    validarIdPositivo(item.id, 'id');
    validarOrdemIndex(item.ordem_index);

    if (ids.has(item.id)) throw new Error('itens possui id duplicado');
    if (ordens.has(item.ordem_index)) throw new Error('itens possui ordem_index duplicado');

    ids.add(item.id);
    ordens.add(item.ordem_index);
  }

  const ordenadas = [...ordens].sort((a, b) => a - b);
  for (let i = 0; i < ordenadas.length; i += 1) {
    if (ordenadas[i] !== i + 1) {
      throw new Error('ordem_index deve ser sequencial iniciando em 1');
    }
  }
};

export const DocumentoService = async () => {
  garantirDiretoriosDocumento();
  const database = await db;
  const repo = new DocumentoRepository(database);
  const profissaoRepo = new ProfissaoRepository(database);

  const listarPorProfissao = async (profissaoId: number): Promise<Documento[]> => {
    validarIdPositivo(profissaoId, 'Profissão');

    const profissaoExiste = await repo.profissaoExiste(profissaoId);
    if (!profissaoExiste) throw new Error('Profissão não encontrada');

    return repo.listarPorProfissao(profissaoId);
  };

  const buscarPorId = async (id: number): Promise<Documento> => {
    validarIdPositivo(id, 'ID');
    const documento = await repo.buscarPorId(id);
    if (!documento) throw new Error('Documento não encontrado');
    return documento;
  };

  const criar = async (
    payload: CriarDocumentoDTO,
    files: DocumentoUploadFiles,
    usuarioAdminId: number
  ): Promise<Documento> => {
    validarIdPositivo(payload.profissao_id, 'Profissão');

    const titulo = payload.titulo?.trim();
    if (!titulo) throw new Error('Título é obrigatório');

    const profissaoExiste = await repo.profissaoExiste(payload.profissao_id);
    if (!profissaoExiste) throw new Error('Profissão não encontrada');

    const urlOnline = paraTextoOpcionalNulo(payload.url_online);
    if (urlOnline) validarUrlOnline(urlOnline);

    validarArquivoPdf(files.arquivo);
    validarImagem(files.foto_capa);

    if (!urlOnline && !files.arquivo) {
      throw new Error('Informe url_online ou arquivo PDF');
    }

    const ordemIndex = payload.ordem_index ?? (await repo.proximaOrdem(payload.profissao_id));
    validarOrdemIndex(ordemIndex);

    const ordemEmUso = await repo.existeNaOrdem(payload.profissao_id, ordemIndex);
    if (ordemEmUso) {
      throw new Error('ordem_index já utilizado para essa profissão');
    }

    let documento = await repo.criar({
      profissao_id: payload.profissao_id,
      ordem_index: ordemIndex,
      titulo,
      descricao: paraTextoOpcionalNulo(payload.descricao),
      pontos_foco: paraTextoOpcionalNulo(payload.pontos_foco),
      url_online: urlOnline,
      arquivo: files.arquivo ? '__upload_pendente__' : null,
      nome_do_arquivo: obterNomeOriginal(files.arquivo),
      foto_capa: null,
      nome_do_arquivo_capa: obterNomeOriginal(files.foto_capa),
    });

    if (!documento.id) return documento;
    if (!files.arquivo && !files.foto_capa) {
      await profissaoRepo.registrarUltimoEditor(payload.profissao_id, usuarioAdminId);
      return documento;
    }

    const novosArquivos: string[] = [];
    try {
      let arquivoPath = files.arquivo ? null : documento.arquivo ?? null;
      let fotoCapaPath = documento.foto_capa ?? null;

      if (files.arquivo) {
        const caminho = montarCaminhosDocumento(payload.profissao_id, documento.id, files.arquivo);
        await fs.promises.writeFile(caminho.caminhoAbsoluto, files.arquivo.buffer);
        arquivoPath = caminho.caminhoPublico;
        novosArquivos.push(caminho.caminhoAbsoluto);
      }

      if (files.foto_capa) {
        const caminho = montarCaminhosFotoCapa(payload.profissao_id, documento.id, files.foto_capa);
        await fs.promises.writeFile(caminho.caminhoAbsoluto, files.foto_capa.buffer);
        fotoCapaPath = caminho.caminhoPublico;
        novosArquivos.push(caminho.caminhoAbsoluto);
      }

      const atualizado = await repo.atualizar(documento.id, {
        profissao_id: payload.profissao_id,
        ordem_index: ordemIndex,
        titulo,
        descricao: paraTextoOpcionalNulo(payload.descricao),
        pontos_foco: paraTextoOpcionalNulo(payload.pontos_foco),
        url_online: urlOnline,
        arquivo: arquivoPath,
        nome_do_arquivo: obterNomeOriginal(files.arquivo),
        foto_capa: fotoCapaPath,
        nome_do_arquivo_capa: obterNomeOriginal(files.foto_capa),
      });

      if (!atualizado) throw new Error('Documento não encontrado');
      documento = atualizado;
      await profissaoRepo.registrarUltimoEditor(payload.profissao_id, usuarioAdminId);
      return documento;
    } catch (error) {
      if (documento.id) {
        await repo.deletar(documento.id);
      }
      await Promise.all(novosArquivos.map((filePath) => removerArquivoSeExistir(filePath)));
      throw error;
    }
  };

  const atualizar = async (
    id: number,
    payload: AtualizarDocumentoDTO,
    files: DocumentoUploadFiles,
    usuarioAdminId: number
  ): Promise<Documento> => {
    validarIdPositivo(id, 'ID');

    const atual = await repo.buscarPorId(id);
    if (!atual) throw new Error('Documento não encontrado');

    const profissaoId = payload.profissao_id ?? atual.profissao_id;
    validarIdPositivo(profissaoId, 'Profissão');

    const profissaoExiste = await repo.profissaoExiste(profissaoId);
    if (!profissaoExiste) throw new Error('Profissão não encontrada');

    const titulo = payload.titulo !== undefined ? payload.titulo.trim() : atual.titulo;
    if (!titulo) throw new Error('Título é obrigatório');

    const mudouProfissao = profissaoId !== atual.profissao_id;
    const ordemIndex = payload.ordem_index ?? (mudouProfissao ? await repo.proximaOrdem(profissaoId) : atual.ordem_index);
    validarOrdemIndex(ordemIndex);

    const ordemEmUso = await repo.existeNaOrdem(profissaoId, ordemIndex, id);
    if (ordemEmUso) {
      throw new Error('ordem_index já utilizado para essa profissão');
    }

    const descricao =
      payload.descricao !== undefined
        ? paraTextoOpcionalNulo(payload.descricao)
        : (atual.descricao ?? null);
    const pontosFoco =
      payload.pontos_foco !== undefined
        ? paraTextoOpcionalNulo(payload.pontos_foco)
        : (atual.pontos_foco ?? null);
    const urlOnline =
      payload.url_online !== undefined ? paraTextoOpcionalNulo(payload.url_online) : (atual.url_online ?? null);

    if (urlOnline) validarUrlOnline(urlOnline);
    validarArquivoPdf(files.arquivo);
    validarImagem(files.foto_capa);
    if (payload.remover_arquivo && files.arquivo) {
      throw new Error('Não é possível remover o PDF e enviar um novo arquivo na mesma requisição');
    }
    if (payload.remover_foto_capa && files.foto_capa) {
      throw new Error('Não é possível remover a foto de capa e enviar uma nova imagem na mesma requisição');
    }

    const novosArquivos: string[] = [];
    const arquivosAntigosParaRemocao: string[] = [];

    try {
      let arquivoPath = atual.arquivo ?? null;
      let fotoCapaPath = atual.foto_capa ?? null;
      let nomeDoArquivo = atual.nome_do_arquivo ?? '';
      let nomeDoArquivoCapa = atual.nome_do_arquivo_capa ?? '';

      if (payload.remover_arquivo) {
        if (arquivoPath) {
          arquivosAntigosParaRemocao.push(caminhoPublicoParaAbsoluto(arquivoPath));
        }
        arquivoPath = null;
        nomeDoArquivo = '';
      }

      if (payload.remover_foto_capa) {
        if (fotoCapaPath) {
          arquivosAntigosParaRemocao.push(caminhoPublicoParaAbsoluto(fotoCapaPath));
        }
        fotoCapaPath = null;
        nomeDoArquivoCapa = '';
      }

      if (files.arquivo) {
        const caminho = montarCaminhosDocumento(profissaoId, id, files.arquivo);
        await fs.promises.writeFile(caminho.caminhoAbsoluto, files.arquivo.buffer);
        novosArquivos.push(caminho.caminhoAbsoluto);

        if (arquivoPath && arquivoPath !== caminho.caminhoPublico) {
          arquivosAntigosParaRemocao.push(caminhoPublicoParaAbsoluto(arquivoPath));
        }
        arquivoPath = caminho.caminhoPublico;
        nomeDoArquivo = obterNomeOriginal(files.arquivo);
      }

      if (files.foto_capa) {
        const caminho = montarCaminhosFotoCapa(profissaoId, id, files.foto_capa);
        await fs.promises.writeFile(caminho.caminhoAbsoluto, files.foto_capa.buffer);
        novosArquivos.push(caminho.caminhoAbsoluto);

        if (fotoCapaPath && fotoCapaPath !== caminho.caminhoPublico) {
          arquivosAntigosParaRemocao.push(caminhoPublicoParaAbsoluto(fotoCapaPath));
        }
        fotoCapaPath = caminho.caminhoPublico;
        nomeDoArquivoCapa = obterNomeOriginal(files.foto_capa);
      }

      const possuiArquivo = Boolean(arquivoPath && arquivoPath.trim().length);
      if (!urlOnline && !possuiArquivo) {
        throw new Error('Informe url_online ou arquivo PDF');
      }

      const atualizado = await repo.atualizar(id, {
        profissao_id: profissaoId,
        ordem_index: ordemIndex,
        titulo,
        descricao,
        pontos_foco: pontosFoco,
        url_online: urlOnline,
        arquivo: arquivoPath,
        nome_do_arquivo: nomeDoArquivo,
        foto_capa: fotoCapaPath,
        nome_do_arquivo_capa: nomeDoArquivoCapa,
      });

      if (!atualizado) throw new Error('Documento não encontrado');

      await profissaoRepo.registrarUltimoEditor(profissaoId, usuarioAdminId);
      if (atual.profissao_id !== profissaoId) {
        await profissaoRepo.registrarUltimoEditor(atual.profissao_id, usuarioAdminId);
      }

      await Promise.all(
        arquivosAntigosParaRemocao.map((filePath) => removerArquivoSeExistir(filePath))
      );

      return atualizado;
    } catch (error) {
      await Promise.all(novosArquivos.map((filePath) => removerArquivoSeExistir(filePath)));
      throw error;
    }
  };

  const deletar = async (id: number, usuarioAdminId: number): Promise<void> => {
    validarIdPositivo(id, 'ID');

    const documento = await repo.buscarPorId(id);
    if (!documento) throw new Error('Documento não encontrado');

    const removido = await repo.deletar(id);
    if (!removido) throw new Error('Documento não encontrado');
    await profissaoRepo.registrarUltimoEditor(documento.profissao_id, usuarioAdminId);

    const arquivos = [documento.arquivo, documento.foto_capa].filter(
      (value): value is string => Boolean(value)
    );

    await Promise.all(
      arquivos.map((filePath) => removerArquivoSeExistir(caminhoPublicoParaAbsoluto(filePath)))
    );
  };

  const reorder = async (payload: ReorderDocumentoDTO, usuarioAdminId: number): Promise<Documento[]> => {
    validarIdPositivo(payload.profissao_id, 'Profissão');
    normalizarItensReorder(payload.itens);

    const profissaoExiste = await repo.profissaoExiste(payload.profissao_id);
    if (!profissaoExiste) throw new Error('Profissão não encontrada');

    const documentosAtuais = await repo.listarPorProfissao(payload.profissao_id);
    const idsAtuais = documentosAtuais.map((documento) => documento.id!);
    const idsPayload = payload.itens.map((item) => item.id);

    if (idsAtuais.length !== idsPayload.length || idsPayload.some((id) => !idsAtuais.includes(id))) {
      throw new Error('Reorder deve incluir todos os documentos da profissão e apenas eles');
    }

    await repo.reorder(payload.profissao_id, payload.itens);
    await profissaoRepo.registrarUltimoEditor(payload.profissao_id, usuarioAdminId);
    return repo.listarPorProfissao(payload.profissao_id);
  };

  return {
    listarPorProfissao,
    buscarPorId,
    criar,
    atualizar,
    deletar,
    reorder,
  };
};
