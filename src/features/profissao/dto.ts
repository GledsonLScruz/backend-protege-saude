import {
  AtualizarProfissaoDTO,
  ClonarProfissaoDTO,
  CriarProfissaoDTO,
  ImportarConteudoProfissaoDTO,
} from './@types';

const normalizeNullableString = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const parseOptionalBoolean = (value: unknown, fieldName: string): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'on', 'yes', 'sim'].includes(normalized)) return true;
    if (['false', '0', 'off', 'no', 'nao', 'não'].includes(normalized)) return false;
  }

  throw new Error(`${fieldName} deve ser booleano`);
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

export class ClonarProfissaoRequest implements ClonarProfissaoDTO {
  clonar_documentos: boolean;
  clonar_formulario: boolean;

  private constructor(props: ClonarProfissaoDTO) {
    this.clonar_documentos = props.clonar_documentos ?? false;
    this.clonar_formulario = props.clonar_formulario ?? false;
  }

  static from(body: any): ClonarProfissaoRequest {
    return new ClonarProfissaoRequest({
      clonar_documentos: parseOptionalBoolean(body?.clonar_documentos, 'clonar_documentos'),
      clonar_formulario: parseOptionalBoolean(body?.clonar_formulario, 'clonar_formulario'),
    });
  }
}

export class ImportarConteudoProfissaoRequest implements ImportarConteudoProfissaoDTO {
  profissao_origem_id: number;
  importar_documentos: boolean;
  importar_formulario: boolean;

  private constructor(props: ImportarConteudoProfissaoDTO) {
    this.profissao_origem_id = props.profissao_origem_id;
    this.importar_documentos = props.importar_documentos ?? false;
    this.importar_formulario = props.importar_formulario ?? false;
  }

  static from(body: any): ImportarConteudoProfissaoRequest {
    return new ImportarConteudoProfissaoRequest({
      profissao_origem_id: Number(body?.profissao_origem_id),
      importar_documentos: parseOptionalBoolean(body?.importar_documentos, 'importar_documentos'),
      importar_formulario: parseOptionalBoolean(body?.importar_formulario, 'importar_formulario'),
    });
  }
}
