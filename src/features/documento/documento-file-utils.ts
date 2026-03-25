import fs from 'fs';
import path from 'path';

const DIRETORIO_DOCUMENTO_PUBLICO = '/data/documento';
const DIRETORIO_FOTO_CAPA_PUBLICO = '/data/fotoDeCapa';
const DIRETORIO_DOCUMENTO_ABSOLUTO = path.join(process.cwd(), 'data', 'documento');
const DIRETORIO_FOTO_CAPA_ABSOLUTO = path.join(process.cwd(), 'data', 'fotoDeCapa');

export const garantirDiretoriosDocumento = () => {
  fs.mkdirSync(DIRETORIO_DOCUMENTO_ABSOLUTO, { recursive: true });
  fs.mkdirSync(DIRETORIO_FOTO_CAPA_ABSOLUTO, { recursive: true });
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

export const montarCaminhosDocumento = (profissaoId: number, documentoId: number, arquivo: Express.Multer.File) => {
  const extensao = obterExtensao(arquivo, '.pdf');
  const nomeArquivo = `${profissaoId}_${documentoId}${extensao}`;
  return {
    caminhoPublico: `${DIRETORIO_DOCUMENTO_PUBLICO}/${nomeArquivo}`,
    caminhoAbsoluto: path.join(DIRETORIO_DOCUMENTO_ABSOLUTO, nomeArquivo),
  };
};

export const montarCaminhosFotoCapa = (profissaoId: number, documentoId: number, arquivo: Express.Multer.File) => {
  const extensao = obterExtensao(arquivo, '.jpg');
  const nomeArquivo = `${profissaoId}_${documentoId}${extensao}`;
  return {
    caminhoPublico: `${DIRETORIO_FOTO_CAPA_PUBLICO}/${nomeArquivo}`,
    caminhoAbsoluto: path.join(DIRETORIO_FOTO_CAPA_ABSOLUTO, nomeArquivo),
  };
};

export const caminhoPublicoParaAbsoluto = (caminhoPublico: string): string =>
  path.join(process.cwd(), caminhoPublico.replace(/^\/+/, ''));

export const removerArquivoSeExistir = async (caminhoAbsoluto: string): Promise<void> => {
  try {
    await fs.promises.unlink(caminhoAbsoluto);
  } catch (error: any) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
};
