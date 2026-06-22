export type Documento = {
  id?: number;
  profissao_id: number;
  ordem_index: number;
  titulo: string;
  descricao?: string | null;
  pontos_foco?: string | null;
  url_online?: string | null;
  arquivo?: string | null;
  nome_do_arquivo: string;
  foto_capa?: string | null;
  nome_do_arquivo_capa: string;
  data_criacao?: string;
  data_update?: string | null;
};

export type CriarDocumentoDTO = {
  profissao_id: number;
  ordem_index?: number;
  titulo: string;
  descricao?: string;
  pontos_foco?: string;
  url_online?: string;
};

export type AtualizarDocumentoDTO = {
  profissao_id?: number;
  ordem_index?: number;
  titulo?: string;
  descricao?: string;
  pontos_foco?: string;
  url_online?: string;
  remover_arquivo?: boolean;
  remover_foto_capa?: boolean;
};

export type DocumentoUploadFiles = {
  arquivo?: Express.Multer.File;
  foto_capa?: Express.Multer.File;
};

export type ReorderDocumentoItemDTO = {
  id: number;
  ordem_index: number;
};

export type ReorderDocumentoDTO = {
  profissao_id: number;
  itens: ReorderDocumentoItemDTO[];
};
