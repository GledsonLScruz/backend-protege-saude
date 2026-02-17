import fs from 'fs';
import path from 'path';
import db from '../../database/db';
import { AtualizarDocumentoDTO, CriarDocumentoDTO, Documento, DocumentoUploadFiles } from './@types';
import { DocumentoRepository } from './documento-repository';

const DIRETORIO_DOCUMENTO_PUBLICO = '/data/documento';
const DIRETORIO_FOTO_CAPA_PUBLICO = '/data/fotoDeCapa';
const DIRETORIO_DOCUMENTO_ABSOLUTO = path.join(process.cwd(), 'data', 'documento');
const DIRETORIO_FOTO_CAPA_ABSOLUTO = path.join(process.cwd(), 'data', 'fotoDeCapa');

const garantirDiretorios = () => {
  fs.mkdirSync(DIRETORIO_DOCUMENTO_ABSOLUTO, { recursive: true });
  fs.mkdirSync(DIRETORIO_FOTO_CAPA_ABSOLUTO, { recursive: true });
};

const validarIdPositivo = (id: number, nomeCampo: string) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${nomeCampo} inválido`);
  }
};

const paraTextoOpcionalNulo = (value: string | undefined | null): string | null => {
  if (value === undefined || value === null) return null;
  const texto = value.trim();
  return texto.length ? texto : null;
};

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

const obterExtensao = (arquivo: Express.Multer.File, extensaoPadrao: string): string => {
  const extOriginal = path.extname(arquivo.originalname || '').toLowerCase();
  if (extOriginal) return extOriginal;

  const mimeType = (arquivo.mimetype || '').toLowerCase();
  if (mimeType.includes('pdf')) return '.pdf';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/webp') return '.webp';
  return extensaoPadrao;
};

const montarCaminhosDocumento = (profissaoId: number, documentoId: number, arquivo: Express.Multer.File) => {
  const extensao = obterExtensao(arquivo, '.pdf');
  const nomeArquivo = `${profissaoId}_${documentoId}${extensao}`;
  return {
    caminhoPublico: `${DIRETORIO_DOCUMENTO_PUBLICO}/${nomeArquivo}`,
    caminhoAbsoluto: path.join(DIRETORIO_DOCUMENTO_ABSOLUTO, nomeArquivo),
  };
};

const montarCaminhosFotoCapa = (profissaoId: number, documentoId: number, arquivo: Express.Multer.File) => {
  const extensao = obterExtensao(arquivo, '.jpg');
  const nomeArquivo = `${profissaoId}_${documentoId}${extensao}`;
  return {
    caminhoPublico: `${DIRETORIO_FOTO_CAPA_PUBLICO}/${nomeArquivo}`,
    caminhoAbsoluto: path.join(DIRETORIO_FOTO_CAPA_ABSOLUTO, nomeArquivo),
  };
};

const caminhoPublicoParaAbsoluto = (caminhoPublico: string): string =>
  path.join(process.cwd(), caminhoPublico.replace(/^\/+/, ''));

const removerArquivoSeExistir = async (caminhoAbsoluto: string): Promise<void> => {
  try {
    await fs.promises.unlink(caminhoAbsoluto);
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      console.error(`Erro ao remover arquivo ${caminhoAbsoluto}:`, error);
    }
  }
};

export const DocumentoService = async () => {
  garantirDiretorios();
  const database = await db;
  const repo = new DocumentoRepository(database);

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

  const criar = async (payload: CriarDocumentoDTO, files: DocumentoUploadFiles): Promise<Documento> => {
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

    let documento = await repo.criar({
      profissao_id: payload.profissao_id,
      titulo,
      descricao: paraTextoOpcionalNulo(payload.descricao),
      pontos_foco: paraTextoOpcionalNulo(payload.pontos_foco),
      url_online: urlOnline,
      arquivo: files.arquivo ? '__upload_pendente__' : null,
      foto_capa: null,
    });

    if (!documento.id) return documento;
    if (!files.arquivo && !files.foto_capa) return documento;

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
        titulo,
        descricao: paraTextoOpcionalNulo(payload.descricao),
        pontos_foco: paraTextoOpcionalNulo(payload.pontos_foco),
        url_online: urlOnline,
        arquivo: arquivoPath,
        foto_capa: fotoCapaPath,
      });

      if (!atualizado) throw new Error('Documento não encontrado');
      documento = atualizado;
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
    files: DocumentoUploadFiles
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

      if (payload.remover_arquivo && arquivoPath) {
        arquivosAntigosParaRemocao.push(caminhoPublicoParaAbsoluto(arquivoPath));
        arquivoPath = null;
      }

      if (payload.remover_foto_capa && fotoCapaPath) {
        arquivosAntigosParaRemocao.push(caminhoPublicoParaAbsoluto(fotoCapaPath));
        fotoCapaPath = null;
      }

      if (files.arquivo) {
        const caminho = montarCaminhosDocumento(profissaoId, id, files.arquivo);
        await fs.promises.writeFile(caminho.caminhoAbsoluto, files.arquivo.buffer);
        novosArquivos.push(caminho.caminhoAbsoluto);

        if (arquivoPath && arquivoPath !== caminho.caminhoPublico) {
          arquivosAntigosParaRemocao.push(caminhoPublicoParaAbsoluto(arquivoPath));
        }
        arquivoPath = caminho.caminhoPublico;
      }

      if (files.foto_capa) {
        const caminho = montarCaminhosFotoCapa(profissaoId, id, files.foto_capa);
        await fs.promises.writeFile(caminho.caminhoAbsoluto, files.foto_capa.buffer);
        novosArquivos.push(caminho.caminhoAbsoluto);

        if (fotoCapaPath && fotoCapaPath !== caminho.caminhoPublico) {
          arquivosAntigosParaRemocao.push(caminhoPublicoParaAbsoluto(fotoCapaPath));
        }
        fotoCapaPath = caminho.caminhoPublico;
      }

      const possuiArquivo = Boolean(arquivoPath && arquivoPath.trim().length);
      if (!urlOnline && !possuiArquivo) {
        throw new Error('Informe url_online ou arquivo PDF');
      }

      const atualizado = await repo.atualizar(id, {
        profissao_id: profissaoId,
        titulo,
        descricao,
        pontos_foco: pontosFoco,
        url_online: urlOnline,
        arquivo: arquivoPath,
        foto_capa: fotoCapaPath,
      });

      if (!atualizado) throw new Error('Documento não encontrado');

      await Promise.all(
        arquivosAntigosParaRemocao.map((filePath) => removerArquivoSeExistir(filePath))
      );

      return atualizado;
    } catch (error) {
      await Promise.all(novosArquivos.map((filePath) => removerArquivoSeExistir(filePath)));
      throw error;
    }
  };

  const deletar = async (id: number): Promise<void> => {
    validarIdPositivo(id, 'ID');

    const documento = await repo.buscarPorId(id);
    if (!documento) throw new Error('Documento não encontrado');

    const removido = await repo.deletar(id);
    if (!removido) throw new Error('Documento não encontrado');

    const arquivos = [documento.arquivo, documento.foto_capa].filter(
      (value): value is string => Boolean(value)
    );

    await Promise.all(
      arquivos.map((filePath) => removerArquivoSeExistir(caminhoPublicoParaAbsoluto(filePath)))
    );
  };

  return {
    listarPorProfissao,
    buscarPorId,
    criar,
    atualizar,
    deletar,
  };
};
