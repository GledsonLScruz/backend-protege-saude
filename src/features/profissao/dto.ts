import { AtualizarProfissaoDTO, CriarProfissaoDTO } from './@types';

const normalizeNullableString = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

export class CriarProfissaoRequest implements CriarProfissaoDTO {
  nome: string;
  descricao?: string | null;
  cor: string;
  status: number;

  private constructor(props: CriarProfissaoDTO) {
    this.nome = props.nome.trim();
    this.descricao = normalizeNullableString(props.descricao);
    this.cor = props.cor.trim();
    this.status = props.status ?? 1;
  }

  static from(body: any): CriarProfissaoRequest {
    return new CriarProfissaoRequest({
      nome: body?.nome ?? '',
      descricao: body?.descricao ?? '',
      cor: body?.cor ?? '',
      status: body?.status,
    });
  }
}

export class AtualizarProfissaoRequest implements AtualizarProfissaoDTO {
  nome?: string;
  descricao?: string | null;
  cor?: string;
  status?: number;

  private constructor(props: AtualizarProfissaoDTO) {
    if ('nome' in props) this.nome = props.nome?.trim();
    if ('descricao' in props) this.descricao = normalizeNullableString(props.descricao);
    if ('cor' in props) this.cor = props.cor?.trim();
    if ('status' in props) this.status = props.status;
  }

  static from(body: any): AtualizarProfissaoRequest {
    const payload: AtualizarProfissaoDTO = {};

    if (body && Object.prototype.hasOwnProperty.call(body, 'nome')) {
      payload.nome = body.nome;
    }
    if (body && Object.prototype.hasOwnProperty.call(body, 'descricao')) {
      payload.descricao = body.descricao;
    }
    if (body && Object.prototype.hasOwnProperty.call(body, 'cor')) {
      payload.cor = body.cor;
    }
    if (body && Object.prototype.hasOwnProperty.call(body, 'status')) {
      payload.status = body.status;
    }

    return new AtualizarProfissaoRequest(payload);
  }
}
