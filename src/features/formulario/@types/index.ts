export const TIPOS_CAMPO = [
  'texto',
  'textarea',
  'numero',
  'data',
  'switch',
  'select',
  'radio',
  'checkbox',
  'foto',
] as const;

export type TipoCampo = (typeof TIPOS_CAMPO)[number];

export const TIPOS_CAMPO_LABELS: Record<TipoCampo, string> = {
  texto: 'Texto curto',
  textarea: 'Texto longo',
  numero: 'Numero',
  data: 'Data',
  switch: 'SIM ou NÃO',
  select: 'Lista suspensa',
  radio: 'Escolha unica',
  checkbox: 'Multiplas escolhas',
  foto: 'Foto',
};

export const TIPOS_CAMPO_COM_OPCOES: TipoCampo[] = ['select', 'radio', 'checkbox'];

export const TIPO_CAMPO_ACEITA_OPCOES: Record<TipoCampo, boolean> = {
  texto: false,
  textarea: false,
  numero: false,
  data: false,
  switch: false,
  select: true,
  radio: true,
  checkbox: true,
  foto: false,
};

export const TIPO_CAMPO_TEM_OPCOES_PADRAO_NAO_EDITAVEIS: Record<TipoCampo, boolean> = {
  texto: false,
  textarea: false,
  numero: false,
  data: false,
  switch: false,
  select: false,
  radio: false,
  checkbox: false,
  foto: false,
};

export type TipoCampoOpcao = {
  valor: TipoCampo;
  label: string;
  aceita_opcoes: boolean;
  tem_opcoes_padrao_nao_editaveis: boolean;
};

export type FormularioCampoValidacoes = {
  obrigatorio: boolean;
  aceita_multiplos: boolean;
  opcoes_permitidas?: string[];
  max_fotos?: number | null;
};

export type FormularioPasso = {
  id?: number;
  profissao_id: number;
  ordem_index: number;
  titulo: string;
  descricao?: string | null;
  data_criacao?: string;
  data_update?: string | null;
};

export type CriarFormularioPassoDTO = {
  profissao_id: number;
  ordem_index?: number;
  titulo: string;
  descricao?: string;
};

export type AtualizarFormularioPassoDTO = {
  ordem_index?: number;
  titulo?: string;
  descricao?: string;
};

export type ReorderFormularioPassoItemDTO = {
  id: number;
  ordem_index: number;
};

export type ReorderFormularioPassoDTO = {
  profissao_id: number;
  itens: ReorderFormularioPassoItemDTO[];
};

export type OpcaoCampo = {
  valor: string;
  label: string;
};

export type FormularioCampo = {
  id?: number;
  formulario_passo_id: number;
  ordem_index: number;
  nome: string;
  tipo_campo: TipoCampo;
  tipo_campo_label?: string;
  tipo_campo_aceita_opcoes?: boolean;
  tipo_campo_tem_opcoes_padrao_nao_editaveis?: boolean;
  opcoes?: OpcaoCampo[] | null;
  max_fotos?: number | null;
  obrigatorio: boolean;
  dica?: string | null;
  validacoes?: FormularioCampoValidacoes;
  data_criacao?: string;
  data_update?: string | null;
};

export type FormularioPublicoPasso = FormularioPasso & {
  campos: FormularioCampo[];
};

export type FormularioPublico = {
  profissao: {
    id: number;
    nome: string;
    descricao?: string | null;
    cor: string;
  };
  passos: FormularioPublicoPasso[];
};

export type CriarFormularioCampoDTO = {
  formulario_passo_id: number;
  ordem_index?: number;
  nome: string;
  tipo_campo: TipoCampo;
  opcoes?: unknown;
  max_fotos?: number | null;
  obrigatorio?: boolean;
  dica?: string;
};

export type AtualizarFormularioCampoDTO = {
  ordem_index?: number;
  nome?: string;
  tipo_campo?: TipoCampo;
  opcoes?: unknown;
  max_fotos?: number | null;
  obrigatorio?: boolean;
  dica?: string;
};

export type ReorderFormularioCampoItemDTO = {
  id: number;
  ordem_index: number;
};

export type ReorderFormularioCampoDTO = {
  formulario_passo_id: number;
  itens: ReorderFormularioCampoItemDTO[];
};
