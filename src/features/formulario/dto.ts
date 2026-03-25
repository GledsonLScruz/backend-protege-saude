import {
  AtualizarFormularioCampoDTO,
  AtualizarFormularioPassoDTO,
  CriarFormularioCampoDTO,
  CriarFormularioPassoDTO,
  ReorderFormularioCampoDTO,
  ReorderFormularioPassoDTO,
  TipoCampo,
} from './@types';

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? NaN : parsed;
};

const parseNullableNumber = (value: unknown): number | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? NaN : parsed;
};

const parseOptionalBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'on', 'yes', 'sim'].includes(normalized)) return true;
    if (['false', '0', 'off', 'no', 'nao', 'não'].includes(normalized)) return false;
  }
  return undefined;
};

const parseOptionalText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  return String(value).trim();
};

const parseOpcoes = (value: unknown): unknown => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return value;
    }
  }
  return value;
};

type ReorderItem = {
  id: number;
  ordem_index: number;
};

const parseReorderItens = (value: unknown): ReorderItem[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const typed = item as Record<string, unknown>;
    return {
      id: Number(typed.id),
      ordem_index: Number(typed.ordem_index),
    };
  });
};

export class CriarFormularioPassoRequest implements CriarFormularioPassoDTO {
  profissao_id: number;
  ordem_index?: number;
  titulo: string;
  descricao?: string;

  private constructor(props: CriarFormularioPassoDTO) {
    this.profissao_id = props.profissao_id;
    this.ordem_index = props.ordem_index;
    this.titulo = props.titulo.trim();
    this.descricao = props.descricao?.trim();
  }

  static from(body: unknown, profissaoId: unknown): CriarFormularioPassoRequest {
    const payload = body as Record<string, unknown> | undefined;
    return new CriarFormularioPassoRequest({
      profissao_id: Number(profissaoId),
      ordem_index: parseOptionalNumber(payload?.ordem_index),
      titulo: String(payload?.titulo ?? ''),
      descricao: parseOptionalText(payload?.descricao),
    });
  }
}

export class AtualizarFormularioPassoRequest implements AtualizarFormularioPassoDTO {
  ordem_index?: number;
  titulo?: string;
  descricao?: string;

  private constructor(props: AtualizarFormularioPassoDTO) {
    this.ordem_index = props.ordem_index;
    this.titulo = props.titulo?.trim();
    this.descricao = props.descricao?.trim();
  }

  static from(body: unknown): AtualizarFormularioPassoRequest {
    const payload = body as Record<string, unknown> | undefined;
    return new AtualizarFormularioPassoRequest({
      ordem_index: parseOptionalNumber(payload?.ordem_index),
      titulo: parseOptionalText(payload?.titulo),
      descricao: parseOptionalText(payload?.descricao),
    });
  }
}

export class ReorderFormularioPassoRequest implements ReorderFormularioPassoDTO {
  profissao_id: number;
  itens: { id: number; ordem_index: number }[];

  private constructor(props: ReorderFormularioPassoDTO) {
    this.profissao_id = props.profissao_id;
    this.itens = props.itens;
  }

  static from(body: unknown): ReorderFormularioPassoRequest {
    const payload = body as Record<string, unknown> | undefined;
    return new ReorderFormularioPassoRequest({
      profissao_id: Number(payload?.profissao_id),
      itens: parseReorderItens(payload?.itens),
    });
  }
}

export class CriarFormularioCampoRequest implements CriarFormularioCampoDTO {
  formulario_passo_id: number;
  ordem_index?: number;
  nome: string;
  tipo_campo: TipoCampo;
  opcoes?: unknown;
  max_fotos?: number | null;
  obrigatorio?: boolean;
  dica?: string;

  private constructor(props: CriarFormularioCampoDTO) {
    this.formulario_passo_id = props.formulario_passo_id;
    this.ordem_index = props.ordem_index;
    this.nome = props.nome.trim();
    this.tipo_campo = props.tipo_campo;
    this.opcoes = props.opcoes;
    this.max_fotos = props.max_fotos;
    this.obrigatorio = props.obrigatorio;
    this.dica = props.dica?.trim();
  }

  static from(body: unknown, passoId: unknown): CriarFormularioCampoRequest {
    const payload = body as Record<string, unknown> | undefined;
    return new CriarFormularioCampoRequest({
      formulario_passo_id: Number(passoId),
      ordem_index: parseOptionalNumber(payload?.ordem_index),
      nome: String(payload?.nome ?? ''),
      tipo_campo: String(payload?.tipo_campo ?? '') as TipoCampo,
      opcoes: parseOpcoes(payload?.opcoes),
      max_fotos: parseNullableNumber(payload?.max_fotos),
      obrigatorio: parseOptionalBoolean(payload?.obrigatorio),
      dica: parseOptionalText(payload?.dica),
    });
  }
}

export class AtualizarFormularioCampoRequest implements AtualizarFormularioCampoDTO {
  ordem_index?: number;
  nome?: string;
  tipo_campo?: TipoCampo;
  opcoes?: unknown;
  max_fotos?: number | null;
  obrigatorio?: boolean;
  dica?: string;

  private constructor(props: AtualizarFormularioCampoDTO) {
    this.ordem_index = props.ordem_index;
    this.nome = props.nome?.trim();
    this.tipo_campo = props.tipo_campo;
    this.opcoes = props.opcoes;
    this.max_fotos = props.max_fotos;
    this.obrigatorio = props.obrigatorio;
    this.dica = props.dica?.trim();
  }

  static from(body: unknown): AtualizarFormularioCampoRequest {
    const payload = body as Record<string, unknown> | undefined;
    return new AtualizarFormularioCampoRequest({
      ordem_index: parseOptionalNumber(payload?.ordem_index),
      nome: parseOptionalText(payload?.nome),
      tipo_campo: payload?.tipo_campo ? (String(payload.tipo_campo) as TipoCampo) : undefined,
      opcoes: parseOpcoes(payload?.opcoes),
      max_fotos: parseNullableNumber(payload?.max_fotos),
      obrigatorio: parseOptionalBoolean(payload?.obrigatorio),
      dica: parseOptionalText(payload?.dica),
    });
  }
}

export class ReorderFormularioCampoRequest implements ReorderFormularioCampoDTO {
  formulario_passo_id: number;
  itens: { id: number; ordem_index: number }[];

  private constructor(props: ReorderFormularioCampoDTO) {
    this.formulario_passo_id = props.formulario_passo_id;
    this.itens = props.itens;
  }

  static from(body: unknown): ReorderFormularioCampoRequest {
    const payload = body as Record<string, unknown> | undefined;
    return new ReorderFormularioCampoRequest({
      formulario_passo_id: Number(payload?.formulario_passo_id),
      itens: parseReorderItens(payload?.itens),
    });
  }
}
