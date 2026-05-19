import { CriarConselhoTutelarDTO } from './@types';

const parseBairros = (value: unknown): string[] => {
  if (value === undefined || value === null) {
    throw new Error('bairros deve ser um array');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parseBairros(parsed);
    } catch (_error) {
      throw new Error('bairros deve ser um array');
    }
  }

  if (!Array.isArray(value)) {
    throw new Error('bairros deve ser um array');
  }

  return value.map((bairro) => String(bairro ?? '').trim()).filter(Boolean);
};

export class CriarConselhoTutelarRequest implements CriarConselhoTutelarDTO {
  nome: string;
  email: string;
  cidade: string;
  estado: string;
  bairros: string[];

  private constructor(props: CriarConselhoTutelarDTO) {
    this.nome = props.nome.trim();
    this.email = props.email.trim();
    this.cidade = props.cidade.trim();
    this.estado = props.estado.trim().toUpperCase();
    this.bairros = props.bairros;
  }

  static from(body: unknown): CriarConselhoTutelarRequest {
    const payload = body as Record<string, unknown> | undefined;
    return new CriarConselhoTutelarRequest({
      nome: String(payload?.nome ?? ''),
      email: String(payload?.email ?? ''),
      cidade: String(payload?.cidade ?? ''),
      estado: String(payload?.estado ?? ''),
      bairros: parseBairros(payload?.bairros),
    });
  }
}

export class AtualizarConselhoTutelarRequest implements CriarConselhoTutelarDTO {
  nome: string;
  email: string;
  cidade: string;
  estado: string;
  bairros: string[];

  private constructor(props: CriarConselhoTutelarDTO) {
    this.nome = props.nome.trim();
    this.email = props.email.trim();
    this.cidade = props.cidade.trim();
    this.estado = props.estado.trim().toUpperCase();
    this.bairros = props.bairros;
  }

  static from(body: unknown): AtualizarConselhoTutelarRequest {
    const payload = body as Record<string, unknown> | undefined;
    return new AtualizarConselhoTutelarRequest({
      nome: String(payload?.nome ?? ''),
      email: String(payload?.email ?? ''),
      cidade: String(payload?.cidade ?? ''),
      estado: String(payload?.estado ?? ''),
      bairros: parseBairros(payload?.bairros),
    });
  }
}
