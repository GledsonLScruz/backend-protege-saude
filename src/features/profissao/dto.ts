import { AtualizarProfissaoDTO, CriarProfissaoDTO } from './@types';

export class CriarProfissaoRequest implements CriarProfissaoDTO {
  nome: string;
  descricao: string;
  cor: string;
  status: number;

  private constructor(props: CriarProfissaoDTO) {
    this.nome = props.nome.trim();
    this.descricao = props.descricao.trim();
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
  descricao?: string;
  cor?: string;
  status?: number;

  private constructor(props: AtualizarProfissaoDTO) {
    this.nome = props.nome?.trim();
    this.descricao = props.descricao?.trim();
    this.cor = props.cor?.trim();
    this.status = props.status;
  }

  static from(body: any): AtualizarProfissaoRequest {
    return new AtualizarProfissaoRequest({
      nome: body?.nome,
      descricao: body?.descricao,
      cor: body?.cor,
      status: body?.status,
    });
  }
}
