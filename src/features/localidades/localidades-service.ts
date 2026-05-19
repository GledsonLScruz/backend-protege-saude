import localidadesData from '../conselho-tutelar/data/estados-cidades-bairros.json';

type LocalidadesCatalogo = Record<string, Record<string, string[]>>;

const catalogo = localidadesData as LocalidadesCatalogo;

export const normalizarBuscaLocalidade = (value: string): string => {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const ordenarPtBr = (a: string, b: string): number => a.localeCompare(b, 'pt-BR');

const buscarChaveNormalizada = (values: string[], value: string): string | undefined => {
  const alvo = normalizarBuscaLocalidade(value);
  if (!alvo) return undefined;
  return values.find((item) => normalizarBuscaLocalidade(item) === alvo);
};

export type EnderecoCatalogo = {
  estado: string;
  cidade: string;
  bairro: string;
};

export const LocalidadesService = {
  listarEstados(): string[] {
    return Object.keys(catalogo).sort(ordenarPtBr);
  },

  resolverEstado(estado: string): string | undefined {
    return buscarChaveNormalizada(this.listarEstados(), estado);
  },

  listarCidades(estado: string): string[] {
    const estadoCatalogo = this.resolverEstado(estado);
    if (!estadoCatalogo) throw new Error('estado inválido');
    return Object.keys(catalogo[estadoCatalogo]).sort(ordenarPtBr);
  },

  resolverCidade(estado: string, cidade: string): string | undefined {
    const estadoCatalogo = this.resolverEstado(estado);
    if (!estadoCatalogo) return undefined;
    return buscarChaveNormalizada(Object.keys(catalogo[estadoCatalogo]), cidade);
  },

  listarBairros(estado: string, cidade: string): string[] {
    const estadoCatalogo = this.resolverEstado(estado);
    if (!estadoCatalogo) throw new Error('estado inválido');

    const cidadeCatalogo = this.resolverCidade(estadoCatalogo, cidade);
    if (!cidadeCatalogo) throw new Error('cidade inválida para o estado informado');

    return [...catalogo[estadoCatalogo][cidadeCatalogo]].sort(ordenarPtBr);
  },

  resolverBairro(estado: string, cidade: string, bairro: string): string | undefined {
    const estadoCatalogo = this.resolverEstado(estado);
    if (!estadoCatalogo) return undefined;

    const cidadeCatalogo = this.resolverCidade(estadoCatalogo, cidade);
    if (!cidadeCatalogo) return undefined;

    return buscarChaveNormalizada(catalogo[estadoCatalogo][cidadeCatalogo], bairro);
  },

  validarEndereco(estado: string, cidade: string, bairro: string): EnderecoCatalogo | undefined {
    const estadoCatalogo = this.resolverEstado(estado);
    if (!estadoCatalogo) return undefined;

    const cidadeCatalogo = this.resolverCidade(estadoCatalogo, cidade);
    if (!cidadeCatalogo) return undefined;

    const bairroCatalogo = this.resolverBairro(estadoCatalogo, cidadeCatalogo, bairro);
    if (!bairroCatalogo) return undefined;

    return {
      estado: estadoCatalogo,
      cidade: cidadeCatalogo,
      bairro: bairroCatalogo,
    };
  },
};
