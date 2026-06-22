import fs from 'fs/promises';
import path from 'path';
import { Database } from 'sqlite';
import {
  AtualizarProfissaoDTO,
  ClonarProfissaoResultado,
  CriarProfissaoDTO,
  ImportarConteudoProfissaoResultado,
  Profissao,
} from './@types';
import { Documento } from '../documento/@types';
import {
  caminhoPublicoParaAbsoluto,
  removerArquivoSeExistir,
} from '../documento/documento-file-utils';

type FormularioPassoClone = {
  id: number;
  ordem_index: number;
  titulo: string;
  descricao: string | null;
};

type FormularioCampoClone = {
  formulario_passo_id: number;
  ordem_index: number;
  nome: string;
  tipo_campo: string;
  opcoes: string | null;
  max_fotos: number | null;
  obrigatorio: number;
  dica: string | null;
};

type ArquivoCopiado = {
  caminhoAbsoluto: string;
};

type ConteudoProfissaoCopiado = {
  documentos: number;
  passos: number;
  perguntas: number;
};

type CopiarConteudoProfissaoOptions = {
  copiarDocumentos: boolean;
  copiarFormulario: boolean;
  anexarAoFinal: boolean;
  arquivosCopiados: ArquivoCopiado[];
};

const montarCaminhoClonado = (
  caminhoOriginal: string,
  profissaoId: number,
  documentoId: number,
  extensaoPadrao: string
): string => {
  const diretorio = path.posix.dirname(caminhoOriginal);
  const extensao = path.posix.extname(caminhoOriginal) || extensaoPadrao;
  return `${diretorio}/${profissaoId}_${documentoId}${extensao}`;
};

export class ProfissaoRepository {
  constructor(private db: Database) {}

  async listar(): Promise<Profissao[]> {
    return this.db.all<Profissao[]>(`
      SELECT p.*,
             pe.usuario_admin_id AS ultimo_editor_id,
             ua.usuario AS ultimo_editor_nome,
             pe.data_edicao AS ultimo_editor_data
        FROM profissao p
        LEFT JOIN profissao_ultima_edicao pe
          ON pe.profissao_id = p.id
        LEFT JOIN usuario_admin ua
          ON ua.id = pe.usuario_admin_id
       WHERE p.data_delete IS NULL
       ORDER BY p.nome ASC
    `);
  }

  async listarAtivas(): Promise<Profissao[]> {
    return this.db.all<Profissao[]>(`
      SELECT * FROM profissao
      WHERE data_delete IS NULL
        AND status = 1
      ORDER BY nome ASC
    `);
  }

  async buscarPorId(id: number): Promise<Profissao | undefined> {
    return this.db.get<Profissao>(
      `SELECT p.*,
              pe.usuario_admin_id AS ultimo_editor_id,
              ua.usuario AS ultimo_editor_nome,
              pe.data_edicao AS ultimo_editor_data
         FROM profissao p
         LEFT JOIN profissao_ultima_edicao pe
           ON pe.profissao_id = p.id
         LEFT JOIN usuario_admin ua
           ON ua.id = pe.usuario_admin_id
        WHERE p.id = ?
          AND p.data_delete IS NULL`,
      id
    );
  }

  async buscarAtivaPorId(id: number): Promise<Profissao | undefined> {
    return this.db.get<Profissao>(
      `SELECT * FROM profissao
       WHERE id = ?
         AND data_delete IS NULL
         AND status = 1`,
      id
    );
  }

  async nomeExiste(nome: string): Promise<boolean> {
    const row = await this.db.get<{ id: number }>(
      `SELECT id FROM profissao WHERE nome = ? LIMIT 1`,
      nome
    );
    return Boolean(row);
  }

  async criar(data: CriarProfissaoDTO): Promise<Profissao> {
    const status = data.status ?? 1;
    const result = await this.db.run(
      `INSERT INTO profissao (nome, descricao, cor, status, data_criacao)
       VALUES (?, ?, ?, ?, datetime('now', '-3 hours'))`,
      data.nome,
      data.descricao ?? null,
      data.cor,
      status
    );

    const criado = await this.buscarPorId(result.lastID!);
    return criado!;
  }

  async atualizar(id: number, data: AtualizarProfissaoDTO): Promise<Profissao | undefined> {
    const atual = await this.buscarPorId(id);
    if (!atual) return undefined;

    const nome = data.nome ?? atual.nome;
    const descricao = Object.prototype.hasOwnProperty.call(data, 'descricao')
      ? (data.descricao ?? null)
      : atual.descricao;
    const cor = data.cor ?? atual.cor;
    const status = data.status ?? atual.status;

    await this.db.run(
      `UPDATE profissao
         SET nome = ?, descricao = ?, cor = ?, status = ?, data_update = datetime('now', '-3 hours')
       WHERE id = ?`,
      nome,
      descricao,
      cor,
      status,
      id
    );

    return this.buscarPorId(id);
  }

  async alterarStatus(id: number, status: number): Promise<Profissao | undefined> {
    const atual = await this.buscarPorId(id);
    if (!atual) return undefined;

    await this.db.run(
      `UPDATE profissao
         SET status = ?, data_update = datetime('now', '-3 hours')
       WHERE id = ?`,
      status,
      id
    );

    return this.buscarPorId(id);
  }

  async clonar(
    original: Profissao,
    nomeClone: string,
    clonarDocumentos: boolean,
    clonarFormulario: boolean
  ): Promise<ClonarProfissaoResultado> {
    if (!original.id) throw new Error('Profissão não encontrada');

    const arquivosCopiados: ArquivoCopiado[] = [];

    await this.db.exec('BEGIN');

    try {
      const profissaoResult = await this.db.run(
        `INSERT INTO profissao (nome, descricao, cor, status, data_criacao)
         VALUES (?, ?, ?, ?, datetime('now', '-3 hours'))`,
        nomeClone,
        original.descricao ?? null,
        original.cor,
        original.status
      );
      const profissaoCloneId = profissaoResult.lastID!;

      const conteudoCopiado = await this.copiarConteudoProfissao(original.id, profissaoCloneId, {
        copiarDocumentos: clonarDocumentos,
        copiarFormulario: clonarFormulario,
        anexarAoFinal: false,
        arquivosCopiados,
      });

      const profissao = await this.buscarPorId(profissaoCloneId);
      if (!profissao) throw new Error('Erro ao clonar profissão');

      await this.db.exec('COMMIT');

      return {
        profissao,
        documentos_clonados: conteudoCopiado.documentos,
        passos_clonados: conteudoCopiado.passos,
        perguntas_clonadas: conteudoCopiado.perguntas,
      };
    } catch (error) {
      await this.db.exec('ROLLBACK');
      await Promise.all(arquivosCopiados.map((arquivo) => removerArquivoSeExistir(arquivo.caminhoAbsoluto)));
      throw error;
    }
  }

  async importarConteudo(
    profissaoOrigemId: number,
    profissaoDestinoId: number,
    importarDocumentos: boolean,
    importarFormulario: boolean
  ): Promise<ImportarConteudoProfissaoResultado> {
    const arquivosCopiados: ArquivoCopiado[] = [];

    await this.db.exec('BEGIN');

    try {
      const conteudoCopiado = await this.copiarConteudoProfissao(profissaoOrigemId, profissaoDestinoId, {
        copiarDocumentos: importarDocumentos,
        copiarFormulario: importarFormulario,
        anexarAoFinal: true,
        arquivosCopiados,
      });

      const profissao = await this.buscarPorId(profissaoDestinoId);
      if (!profissao) throw new Error('Profissão não encontrada');

      await this.db.exec('COMMIT');

      return {
        profissao,
        documentos_importados: conteudoCopiado.documentos,
        passos_importados: conteudoCopiado.passos,
        perguntas_importadas: conteudoCopiado.perguntas,
      };
    } catch (error) {
      await this.db.exec('ROLLBACK');
      await Promise.all(arquivosCopiados.map((arquivo) => removerArquivoSeExistir(arquivo.caminhoAbsoluto)));
      throw error;
    }
  }

  async registrarUltimoEditor(profissaoId: number, usuarioAdminId: number): Promise<void> {
    await this.db.run(
      `INSERT INTO profissao_ultima_edicao (profissao_id, usuario_admin_id, data_edicao)
       VALUES (?, ?, datetime('now', '-3 hours'))
       ON CONFLICT(profissao_id) DO UPDATE SET
         usuario_admin_id = excluded.usuario_admin_id,
         data_edicao = datetime('now', '-3 hours')`,
      profissaoId,
      usuarioAdminId
    );

    await this.db.run(
      `UPDATE profissao
          SET data_update = datetime('now', '-3 hours')
        WHERE id = ?
          AND data_delete IS NULL`,
      profissaoId
    );
  }

  async deletarComDependencias(id: number): Promise<Documento[]> {
    const atual = await this.buscarPorId(id);
    if (!atual) throw new Error('Profissão não encontrada');

    await this.db.exec('BEGIN');

    try {
      const documentos = await this.db.all<Documento[]>(
        `SELECT * FROM documentos WHERE profissao_id = ?`,
        id
      );

      await this.db.run(
        `UPDATE denuncias
            SET profissao_id = NULL
          WHERE profissao_id = ?`,
        id
      );

      await this.db.run(`DELETE FROM documentos WHERE profissao_id = ?`, id);
      await this.db.run(`DELETE FROM profissao WHERE id = ?`, id);

      await this.db.exec('COMMIT');
      return documentos;
    } catch (error) {
      await this.db.exec('ROLLBACK');
      throw error;
    }
  }

  private async copiarConteudoProfissao(
    profissaoOrigemId: number,
    profissaoDestinoId: number,
    options: CopiarConteudoProfissaoOptions
  ): Promise<ConteudoProfissaoCopiado> {
    const documentos = options.copiarDocumentos
      ? await this.copiarDocumentosProfissao(
        profissaoOrigemId,
        profissaoDestinoId,
        options.anexarAoFinal,
        options.arquivosCopiados
      )
      : 0;

    const formulario = options.copiarFormulario
      ? await this.copiarFormularioProfissao(profissaoOrigemId, profissaoDestinoId, options.anexarAoFinal)
      : { passos: 0, perguntas: 0 };

    return {
      documentos,
      passos: formulario.passos,
      perguntas: formulario.perguntas,
    };
  }

  private async copiarDocumentosProfissao(
    profissaoOrigemId: number,
    profissaoDestinoId: number,
    anexarAoFinal: boolean,
    arquivosCopiados: ArquivoCopiado[]
  ): Promise<number> {
    const documentos = await this.db.all<Documento[]>(
      `SELECT * FROM documentos WHERE profissao_id = ? ORDER BY ordem_index ASC`,
      profissaoOrigemId
    );

    let proximaOrdem = anexarAoFinal ? await this.proximaOrdemDocumento(profissaoDestinoId) : undefined;
    let documentosCopiados = 0;

    for (const documento of documentos) {
      const ordemIndex = proximaOrdem ?? documento.ordem_index;
      if (proximaOrdem !== undefined) proximaOrdem += 1;

      const documentoResult = await this.db.run(
        `INSERT INTO documentos (
          profissao_id,
          ordem_index,
          titulo,
          descricao,
          pontos_foco,
          url_online,
          arquivo,
          nome_do_arquivo,
          foto_capa,
          nome_do_arquivo_capa,
          data_criacao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-3 hours'))`,
        profissaoDestinoId,
        ordemIndex,
        documento.titulo,
        documento.descricao ?? null,
        documento.pontos_foco ?? null,
        documento.url_online ?? null,
        documento.arquivo ?? null,
        documento.nome_do_arquivo,
        documento.foto_capa ?? null,
        documento.nome_do_arquivo_capa
      );

      const documentoCloneId = documentoResult.lastID!;
      let arquivoClonado = documento.arquivo ?? null;
      let fotoCapaClonada = documento.foto_capa ?? null;

      if (documento.arquivo) {
        arquivoClonado = await this.copiarArquivoClonado(
          documento.arquivo,
          profissaoDestinoId,
          documentoCloneId,
          '.pdf',
          arquivosCopiados
        );
      }

      if (documento.foto_capa) {
        fotoCapaClonada = await this.copiarArquivoClonado(
          documento.foto_capa,
          profissaoDestinoId,
          documentoCloneId,
          '.jpg',
          arquivosCopiados
        );
      }

      await this.db.run(
        `UPDATE documentos
            SET arquivo = ?,
                foto_capa = ?
          WHERE id = ?`,
        arquivoClonado,
        fotoCapaClonada,
        documentoCloneId
      );

      documentosCopiados += 1;
    }

    return documentosCopiados;
  }

  private async copiarFormularioProfissao(
    profissaoOrigemId: number,
    profissaoDestinoId: number,
    anexarAoFinal: boolean
  ): Promise<{ passos: number; perguntas: number }> {
    const passos = await this.db.all<FormularioPassoClone[]>(
      `SELECT id, ordem_index, titulo, descricao
         FROM formulario_passo
        WHERE profissao_id = ?
        ORDER BY ordem_index ASC`,
      profissaoOrigemId
    );

    let proximaOrdem = anexarAoFinal ? await this.proximaOrdemPasso(profissaoDestinoId) : undefined;
    let passosCopiados = 0;
    let perguntasCopiadas = 0;

    for (const passo of passos) {
      const ordemIndex = proximaOrdem ?? passo.ordem_index;
      if (proximaOrdem !== undefined) proximaOrdem += 1;

      const passoResult = await this.db.run(
        `INSERT INTO formulario_passo (profissao_id, ordem_index, titulo, descricao, data_criacao)
         VALUES (?, ?, ?, ?, datetime('now', '-3 hours'))`,
        profissaoDestinoId,
        ordemIndex,
        passo.titulo,
        passo.descricao ?? null
      );
      const passoCloneId = passoResult.lastID!;
      passosCopiados += 1;

      const campos = await this.db.all<FormularioCampoClone[]>(
        `SELECT formulario_passo_id,
                ordem_index,
                nome,
                tipo_campo,
                opcoes,
                max_fotos,
                obrigatorio,
                dica
           FROM formulario_campo
          WHERE formulario_passo_id = ?
          ORDER BY ordem_index ASC`,
        passo.id
      );

      for (const campo of campos) {
        await this.db.run(
          `INSERT INTO formulario_campo (
            formulario_passo_id,
            ordem_index,
            nome,
            tipo_campo,
            opcoes,
            max_fotos,
            obrigatorio,
            dica,
            data_criacao
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-3 hours'))`,
          passoCloneId,
          campo.ordem_index,
          campo.nome,
          campo.tipo_campo,
          campo.opcoes,
          campo.max_fotos,
          campo.obrigatorio,
          campo.dica
        );
        perguntasCopiadas += 1;
      }
    }

    return { passos: passosCopiados, perguntas: perguntasCopiadas };
  }

  private async proximaOrdemDocumento(profissaoId: number): Promise<number> {
    const row = await this.db.get<{ max_ordem: number | null }>(
      `SELECT MAX(ordem_index) AS max_ordem FROM documentos WHERE profissao_id = ?`,
      profissaoId
    );
    return (row?.max_ordem ?? 0) + 1;
  }

  private async proximaOrdemPasso(profissaoId: number): Promise<number> {
    const row = await this.db.get<{ max_ordem: number | null }>(
      `SELECT MAX(ordem_index) AS max_ordem FROM formulario_passo WHERE profissao_id = ?`,
      profissaoId
    );
    return (row?.max_ordem ?? 0) + 1;
  }

  private async copiarArquivoClonado(
    caminhoOriginal: string,
    profissaoCloneId: number,
    documentoCloneId: number,
    extensaoPadrao: string,
    arquivosCopiados: ArquivoCopiado[]
  ): Promise<string> {
    const caminhoClonado = montarCaminhoClonado(caminhoOriginal, profissaoCloneId, documentoCloneId, extensaoPadrao);
    const origemAbsoluta = caminhoPublicoParaAbsoluto(caminhoOriginal);
    const destinoAbsoluto = caminhoPublicoParaAbsoluto(caminhoClonado);

    await fs.copyFile(origemAbsoluta, destinoAbsoluto);
    arquivosCopiados.push({ caminhoAbsoluto: destinoAbsoluto });

    return caminhoClonado;
  }
}
