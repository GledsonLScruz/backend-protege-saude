import db from '../../database/db';
import { ProfissaoRepository } from '../profissao/profissao-repository';
import {
  AtualizarFormularioCampoDTO,
  AtualizarFormularioPassoDTO,
  CriarFormularioCampoDTO,
  CriarFormularioPassoDTO,
  FormularioCampo,
  FormularioCampoValidacoes,
  FormularioPublico,
  FormularioPasso,
  OpcaoCampo,
  ReorderFormularioCampoDTO,
  ReorderFormularioPassoDTO,
  TIPO_CAMPO_ACEITA_OPCOES,
  TIPO_CAMPO_TEM_OPCOES_PADRAO_NAO_EDITAVEIS,
  TIPOS_CAMPO,
  TIPOS_CAMPO_COM_OPCOES,
  TIPOS_CAMPO_LABELS,
  TipoCampo,
  TipoCampoOpcao,
} from './@types';
import { FormularioRepository } from './formulario-repository';

const validarIdPositivo = (id: number, nomeCampo: string) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${nomeCampo} inválido`);
  }
};

const validarOrdemIndex = (ordemIndex: number, nomeCampo = 'ordem_index') => {
  if (!Number.isInteger(ordemIndex) || ordemIndex <= 0) {
    throw new Error(`${nomeCampo} inválido`);
  }
};

const normalizarTextoOpcional = (value: string | undefined): string | null => {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const validarTipoCampo = (tipoCampo: string): TipoCampo => {
  if (!TIPOS_CAMPO.includes(tipoCampo as TipoCampo)) {
    throw new Error('tipo_campo inválido');
  }
  return tipoCampo as TipoCampo;
};

const normalizarOpcoes = (opcoes: unknown): OpcaoCampo[] | null => {
  if (opcoes === undefined || opcoes === null) return null;
  if (!Array.isArray(opcoes)) {
    throw new Error('opcoes deve ser um array');
  }

  return opcoes.map((item) => {
    if (!item || typeof item !== 'object') {
      throw new Error('Cada opção deve conter valor e label');
    }

    const typed = item as Record<string, unknown>;
    const valor = String(typed.valor ?? '').trim();
    const label = String(typed.label ?? '').trim();

    if (!valor || !label) {
      throw new Error('Cada opção deve conter valor e label');
    }

    return { valor, label };
  });
};

const normalizarMaxFotos = (maxFotos: unknown): number | null => {
  if (maxFotos === undefined || maxFotos === null) return null;
  if (typeof maxFotos !== 'number' || !Number.isInteger(maxFotos) || maxFotos < 1 || maxFotos > 5) {
    throw new Error('max_fotos deve ser um inteiro entre 1 e 5');
  }
  return maxFotos;
};

const validarRegraOpcoes = (tipoCampo: TipoCampo, opcoes: OpcaoCampo[] | null) => {
  if (TIPOS_CAMPO_COM_OPCOES.includes(tipoCampo)) {
    if (!opcoes?.length) {
      throw new Error(`opcoes é obrigatória para tipo_campo ${tipoCampo}`);
    }
    return;
  }

  if (opcoes?.length) {
    throw new Error(`opcoes só é permitida para tipo_campo ${TIPOS_CAMPO_COM_OPCOES.join(', ')}`);
  }
};

const validarRegraMaxFotos = (tipoCampo: TipoCampo, maxFotos: number | null) => {
  if (tipoCampo === 'foto') {
    if (maxFotos === null) {
      throw new Error('max_fotos é obrigatório para tipo_campo foto');
    }
    return;
  }

  if (maxFotos !== null) {
    throw new Error('max_fotos só é permitido para tipo_campo foto');
  }
};

const montarValidacoesCampo = (campo: FormularioCampo): FormularioCampoValidacoes => {
  const opcoesPermitidas = campo.opcoes?.map((opcao) => opcao.valor);

  return {
    obrigatorio: campo.obrigatorio,
    aceita_multiplos: campo.tipo_campo === 'checkbox' || campo.tipo_campo === 'foto',
    opcoes_permitidas: opcoesPermitidas?.length ? opcoesPermitidas : undefined,
    max_fotos: campo.tipo_campo === 'foto' ? (campo.max_fotos ?? null) : null,
  };
};

const serializarCampoPublico = (campo: FormularioCampo): FormularioCampo => {
  return {
    ...campo,
    validacoes: montarValidacoesCampo({
      ...campo,
    }),
  };
};

const normalizarItensReorder = (itens: { id: number; ordem_index: number }[]) => {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new Error('itens de reorder é obrigatório');
  }

  const ids = new Set<number>();
  const ordens = new Set<number>();

  for (const item of itens) {
    validarIdPositivo(item.id, 'id');
    validarOrdemIndex(item.ordem_index);

    if (ids.has(item.id)) throw new Error('itens possui id duplicado');
    if (ordens.has(item.ordem_index)) throw new Error('itens possui ordem_index duplicado');

    ids.add(item.id);
    ordens.add(item.ordem_index);
  }

  const ordenadas = [...ordens].sort((a, b) => a - b);
  for (let i = 0; i < ordenadas.length; i += 1) {
    if (ordenadas[i] !== i + 1) {
      throw new Error('ordem_index deve ser sequencial iniciando em 1');
    }
  }
};

export const FormularioService = async () => {
  const database = await db;
  const repo = new FormularioRepository(database);
  const profissaoRepo = new ProfissaoRepository(database);

  const listarPassosPorProfissao = async (profissaoId: number): Promise<FormularioPasso[]> => {
    validarIdPositivo(profissaoId, 'Profissão');

    const profissaoExiste = await repo.profissaoExiste(profissaoId);
    if (!profissaoExiste) throw new Error('Profissão não encontrada');

    return repo.listarPassosPorProfissao(profissaoId);
  };

  const criarPasso = async (payload: CriarFormularioPassoDTO): Promise<FormularioPasso> => {
    validarIdPositivo(payload.profissao_id, 'Profissão');

    const titulo = payload.titulo?.trim();
    if (!titulo) throw new Error('Título é obrigatório');

    const profissaoExiste = await repo.profissaoExiste(payload.profissao_id);
    if (!profissaoExiste) throw new Error('Profissão não encontrada');

    const ordemIndex = payload.ordem_index ?? (await repo.proximaOrdemPasso(payload.profissao_id));
    validarOrdemIndex(ordemIndex);

    const ordemEmUso = await repo.existePassoNaOrdem(payload.profissao_id, ordemIndex);
    if (ordemEmUso) {
      throw new Error('ordem_index já utilizado para essa profissão');
    }

    return repo.criarPasso({
      profissao_id: payload.profissao_id,
      ordem_index: ordemIndex,
      titulo,
      descricao: normalizarTextoOpcional(payload.descricao),
    });
  };

  const atualizarPasso = async (id: number, payload: AtualizarFormularioPassoDTO): Promise<FormularioPasso> => {
    validarIdPositivo(id, 'ID');

    const atual = await repo.buscarPassoPorId(id);
    if (!atual) throw new Error('Passo não encontrado');

    const titulo = payload.titulo !== undefined ? payload.titulo.trim() : atual.titulo;
    if (!titulo) throw new Error('Título é obrigatório');

    const ordemIndex = payload.ordem_index ?? atual.ordem_index;
    validarOrdemIndex(ordemIndex);

    const ordemEmUso = await repo.existePassoNaOrdem(atual.profissao_id, ordemIndex, id);
    if (ordemEmUso) {
      throw new Error('ordem_index já utilizado para essa profissão');
    }

    const updated = await repo.atualizarPasso(id, {
      profissao_id: atual.profissao_id,
      ordem_index: ordemIndex,
      titulo,
      descricao: payload.descricao !== undefined ? normalizarTextoOpcional(payload.descricao) : (atual.descricao ?? null),
    });

    if (!updated) throw new Error('Passo não encontrado');
    return updated;
  };

  const deletarPasso = async (id: number): Promise<void> => {
    validarIdPositivo(id, 'ID');
    const deleted = await repo.deletarPasso(id);
    if (!deleted) throw new Error('Passo não encontrado');
  };

  const reorderPassos = async (payload: ReorderFormularioPassoDTO): Promise<FormularioPasso[]> => {
    validarIdPositivo(payload.profissao_id, 'Profissão');
    normalizarItensReorder(payload.itens);

    const profissaoExiste = await repo.profissaoExiste(payload.profissao_id);
    if (!profissaoExiste) throw new Error('Profissão não encontrada');

    const passosAtuais = await repo.listarPassosPorProfissao(payload.profissao_id);
    const idsAtuais = passosAtuais.map((passo) => passo.id!);
    const idsPayload = payload.itens.map((item) => item.id);

    if (idsAtuais.length !== idsPayload.length || idsPayload.some((id) => !idsAtuais.includes(id))) {
      throw new Error('Reorder deve incluir todos os passos da profissão e apenas eles');
    }

    await repo.reorderPassos(payload.profissao_id, payload.itens);
    return repo.listarPassosPorProfissao(payload.profissao_id);
  };

  const listarCamposPorPasso = async (passoId: number): Promise<FormularioCampo[]> => {
    validarIdPositivo(passoId, 'Passo');

    const passoExiste = await repo.passoExiste(passoId);
    if (!passoExiste) throw new Error('Passo não encontrado');

    return repo.listarCamposPorPasso(passoId);
  };

  const listarTiposCampo = async (): Promise<TipoCampoOpcao[]> =>
    TIPOS_CAMPO.map((tipo) => ({
      valor: tipo,
      label: TIPOS_CAMPO_LABELS[tipo],
      aceita_opcoes: TIPO_CAMPO_ACEITA_OPCOES[tipo],
      tem_opcoes_padrao_nao_editaveis: TIPO_CAMPO_TEM_OPCOES_PADRAO_NAO_EDITAVEIS[tipo],
    }));

  const obterFormularioPublicoPorProfissao = async (profissaoId: number): Promise<FormularioPublico> => {
    validarIdPositivo(profissaoId, 'Profissão');

    const profissao = await profissaoRepo.buscarAtivaPorId(profissaoId);
    if (!profissao) {
      const profissaoExiste = await profissaoRepo.buscarPorId(profissaoId);
      if (profissaoExiste) throw new Error('Profissão inativa');
      throw new Error('Profissão não encontrada');
    }

    const passos = await repo.listarPassosPorProfissao(profissaoId);
    const passosComCampos = await Promise.all(
      passos.map(async (passo) => {
        const campos = await repo.listarCamposPorPasso(passo.id!);
        return {
          ...passo,
          campos: campos.map(serializarCampoPublico),
        };
      })
    );

    return {
      profissao: {
        id: profissao.id!,
        nome: profissao.nome,
        descricao: profissao.descricao,
        cor: profissao.cor,
      },
      passos: passosComCampos,
    };
  };

  const criarCampo = async (payload: CriarFormularioCampoDTO): Promise<FormularioCampo> => {
    validarIdPositivo(payload.formulario_passo_id, 'Passo');

    const passoExiste = await repo.passoExiste(payload.formulario_passo_id);
    if (!passoExiste) throw new Error('Passo não encontrado');

    const nome = payload.nome?.trim();
    if (!nome) throw new Error('Nome é obrigatório');

    const tipoCampo = validarTipoCampo(payload.tipo_campo);

    const ordemIndex = payload.ordem_index ?? (await repo.proximaOrdemCampo(payload.formulario_passo_id));
    validarOrdemIndex(ordemIndex);

    const ordemEmUso = await repo.existeCampoNaOrdem(payload.formulario_passo_id, ordemIndex);
    if (ordemEmUso) {
      throw new Error('ordem_index já utilizado para esse passo');
    }

    const opcoes = normalizarOpcoes(payload.opcoes);
    const maxFotos = normalizarMaxFotos(payload.max_fotos);
    validarRegraOpcoes(tipoCampo, opcoes);
    validarRegraMaxFotos(tipoCampo, maxFotos);

    return repo.criarCampo({
      formulario_passo_id: payload.formulario_passo_id,
      ordem_index: ordemIndex,
      nome,
      tipo_campo: tipoCampo,
      opcoes: opcoes ? JSON.stringify(opcoes) : null,
      max_fotos: maxFotos,
      obrigatorio: payload.obrigatorio ?? false,
      dica: normalizarTextoOpcional(payload.dica),
    });
  };

  const atualizarCampo = async (id: number, payload: AtualizarFormularioCampoDTO): Promise<FormularioCampo> => {
    validarIdPositivo(id, 'ID');

    const atual = await repo.buscarCampoPorId(id);
    if (!atual) throw new Error('Campo não encontrado');

    const nome = payload.nome !== undefined ? payload.nome.trim() : atual.nome;
    if (!nome) throw new Error('Nome é obrigatório');

    const tipoCampo = validarTipoCampo(payload.tipo_campo ?? atual.tipo_campo);

    const ordemIndex = payload.ordem_index ?? atual.ordem_index;
    validarOrdemIndex(ordemIndex);

    const ordemEmUso = await repo.existeCampoNaOrdem(atual.formulario_passo_id, ordemIndex, id);
    if (ordemEmUso) {
      throw new Error('ordem_index já utilizado para esse passo');
    }

    const opcoes = payload.opcoes !== undefined ? normalizarOpcoes(payload.opcoes) : (atual.opcoes ?? null);
    const maxFotos = payload.max_fotos !== undefined ? normalizarMaxFotos(payload.max_fotos) : (atual.max_fotos ?? null);
    validarRegraOpcoes(tipoCampo, opcoes);
    validarRegraMaxFotos(tipoCampo, maxFotos);

    const updated = await repo.atualizarCampo(id, {
      formulario_passo_id: atual.formulario_passo_id,
      ordem_index: ordemIndex,
      nome,
      tipo_campo: tipoCampo,
      opcoes: opcoes ? JSON.stringify(opcoes) : null,
      max_fotos: tipoCampo === 'foto' ? maxFotos : null,
      obrigatorio: payload.obrigatorio ?? atual.obrigatorio,
      dica: payload.dica !== undefined ? normalizarTextoOpcional(payload.dica) : (atual.dica ?? null),
    });

    if (!updated) throw new Error('Campo não encontrado');
    return updated;
  };

  const deletarCampo = async (id: number): Promise<void> => {
    validarIdPositivo(id, 'ID');
    const deleted = await repo.deletarCampo(id);
    if (!deleted) throw new Error('Campo não encontrado');
  };

  const reorderCampos = async (payload: ReorderFormularioCampoDTO): Promise<FormularioCampo[]> => {
    validarIdPositivo(payload.formulario_passo_id, 'Passo');
    normalizarItensReorder(payload.itens);

    const passoExiste = await repo.passoExiste(payload.formulario_passo_id);
    if (!passoExiste) throw new Error('Passo não encontrado');

    const camposAtuais = await repo.listarCamposPorPasso(payload.formulario_passo_id);
    const idsAtuais = camposAtuais.map((campo) => campo.id!);
    const idsPayload = payload.itens.map((item) => item.id);

    if (idsAtuais.length !== idsPayload.length || idsPayload.some((id) => !idsAtuais.includes(id))) {
      throw new Error('Reorder deve incluir todos os campos do passo e apenas eles');
    }

    await repo.reorderCampos(payload.formulario_passo_id, payload.itens);
    return repo.listarCamposPorPasso(payload.formulario_passo_id);
  };

  return {
    listarPassosPorProfissao,
    obterFormularioPublicoPorProfissao,
    criarPasso,
    atualizarPasso,
    deletarPasso,
    reorderPassos,
    listarCamposPorPasso,
    listarTiposCampo,
    criarCampo,
    atualizarCampo,
    deletarCampo,
    reorderCampos,
  };
};
