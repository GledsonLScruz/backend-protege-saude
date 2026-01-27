export type Profissao = {
  id?: number;
  nome: string;
  descricao: string;
  cor: string;
  status: number; // 1 = ativa, 0 = desativada
  data_criacao?: string;
  data_update?: string;
  data_delete?: string | null;
};

export type CriarProfissaoDTO = {
  nome: string;
  descricao: string;
  cor: string;
  status?: number;
};

export type AtualizarProfissaoDTO = {
  nome?: string;
  descricao?: string;
  cor?: string;
  status?: number;
};
