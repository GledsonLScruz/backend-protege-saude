export type Documento = {
  id?: number;
  profissao_id: number;
  titulo: string;
  descricao?: string | null;
  pontos_foco?: string | null;
  url_online?: string | null;
  arquivo?: string | null;
  foto_capa?: string | null;
  data_criacao?: string;
  data_update?: string | null;
};

export type CriarDocumentoDTO = {
  profissao_id: number;
  titulo: string;
  descricao?: string;
  pontos_foco?: string;
  url_online?: string;
};

export type AtualizarDocumentoDTO = {
  profissao_id?: number;
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
