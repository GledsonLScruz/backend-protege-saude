import { AtualizarDocumentoDTO, CriarDocumentoDTO, ReorderDocumentoDTO } from './@types';

const normalizeOptionalText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  return String(value).trim();
};

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
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

export class CriarDocumentoRequest implements CriarDocumentoDTO {
  profissao_id: number;
  ordem_index?: number;
  titulo: string;
  descricao?: string;
  pontos_foco?: string;
  url_online?: string;

  private constructor(props: CriarDocumentoDTO) {
    this.profissao_id = props.profissao_id;
    this.ordem_index = props.ordem_index;
    this.titulo = props.titulo.trim();
    this.descricao = props.descricao?.trim();
    this.pontos_foco = props.pontos_foco?.trim();
    this.url_online = props.url_online?.trim();
  }

  static from(body: unknown): CriarDocumentoRequest {
    const payload = body as Record<string, unknown> | undefined;
    return new CriarDocumentoRequest({
      profissao_id: Number(payload?.profissao_id),
      ordem_index: parseOptionalNumber(payload?.ordem_index),
      titulo: String(payload?.titulo ?? ''),
      descricao: normalizeOptionalText(payload?.descricao),
      pontos_foco: normalizeOptionalText(payload?.pontos_foco),
      url_online: normalizeOptionalText(payload?.url_online),
    });
  }
}

export class AtualizarDocumentoRequest implements AtualizarDocumentoDTO {
  profissao_id?: number;
  ordem_index?: number;
  titulo?: string;
  descricao?: string;
  pontos_foco?: string;
  url_online?: string;
  remover_arquivo?: boolean;
  remover_foto_capa?: boolean;

  private constructor(props: AtualizarDocumentoDTO) {
    this.profissao_id = props.profissao_id;
    this.ordem_index = props.ordem_index;
    this.titulo = props.titulo?.trim();
    this.descricao = props.descricao?.trim();
    this.pontos_foco = props.pontos_foco?.trim();
    this.url_online = props.url_online?.trim();
    this.remover_arquivo = props.remover_arquivo;
    this.remover_foto_capa = props.remover_foto_capa;
  }

  static from(body: unknown): AtualizarDocumentoRequest {
    const payload = body as Record<string, unknown> | undefined;
    return new AtualizarDocumentoRequest({
      profissao_id: parseOptionalNumber(payload?.profissao_id),
      ordem_index: parseOptionalNumber(payload?.ordem_index),
      titulo: normalizeOptionalText(payload?.titulo),
      descricao: normalizeOptionalText(payload?.descricao),
      pontos_foco: normalizeOptionalText(payload?.pontos_foco),
      url_online: normalizeOptionalText(payload?.url_online),
      remover_arquivo: parseOptionalBoolean(payload?.remover_arquivo),
      remover_foto_capa: parseOptionalBoolean(payload?.remover_foto_capa),
    });
  }
}

const parseReorderItens = (value: unknown): { id: number; ordem_index: number }[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const typed = item as Record<string, unknown>;
    return {
      id: Number(typed.id),
      ordem_index: Number(typed.ordem_index),
    };
  });
};

export class ReorderDocumentoRequest implements ReorderDocumentoDTO {
  profissao_id: number;
  itens: { id: number; ordem_index: number }[];

  private constructor(props: ReorderDocumentoDTO) {
    this.profissao_id = props.profissao_id;
    this.itens = props.itens;
  }

  static from(body: unknown): ReorderDocumentoRequest {
    const payload = body as Record<string, unknown> | undefined;
    return new ReorderDocumentoRequest({
      profissao_id: Number(payload?.profissao_id),
      itens: parseReorderItens(payload?.itens),
    });
  }
}
