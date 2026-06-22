export type Profissao = {
  id?: number;
  nome: string;
  descricao?: string | null;
  cor: string;
  status: number; // 1 = ativa, 0 = desativada
  data_criacao?: string;
  data_update?: string;
  data_delete?: string | null;
  ultimo_editor_id?: number | null;
  ultimo_editor_nome?: string | null;
  ultimo_editor_data?: string | null;
};

export type CriarProfissaoDTO = {
  nome: string;
  descricao?: string | null;
  cor: string;
  status?: number;
};

export type AtualizarProfissaoDTO = {
  nome?: string;
  descricao?: string | null;
  cor?: string;
  status?: number;
};

export type ClonarProfissaoDTO = {
  clonar_documentos?: boolean;
  clonar_formulario?: boolean;
};

export type ClonarProfissaoResultado = {
  profissao: Profissao;
  documentos_clonados: number;
  passos_clonados: number;
  perguntas_clonadas: number;
};

export type ImportarConteudoProfissaoDTO = {
  profissao_origem_id: number;
  importar_documentos?: boolean;
  importar_formulario?: boolean;
};

export type ImportarConteudoProfissaoResultado = {
  profissao: Profissao;
  documentos_importados: number;
  passos_importados: number;
  perguntas_importadas: number;
};
