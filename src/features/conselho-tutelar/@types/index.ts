export type ConselhoTutelar = {
  id?: number;
  nome: string;
  email: string;
  cidade: string;
  estado: string;
  bairros: string[];
  data_criacao?: string;
  data_update?: string | null;
};

export type CriarConselhoTutelarDTO = {
  nome: string;
  email: string;
  cidade: string;
  estado: string;
  bairros: string[];
};

export type AtualizarConselhoTutelarDTO = CriarConselhoTutelarDTO;
