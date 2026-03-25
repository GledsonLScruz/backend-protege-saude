import { Database } from 'sqlite';
import {
  FormularioCampo,
  FormularioPasso,
  ReorderFormularioCampoItemDTO,
  ReorderFormularioPassoItemDTO,
  TIPO_CAMPO_ACEITA_OPCOES,
  TIPO_CAMPO_TEM_OPCOES_PADRAO_NAO_EDITAVEIS,
  TipoCampo,
  TIPOS_CAMPO_LABELS,
} from './@types';

type FormularioPassoPersistencia = {
  profissao_id: number;
  ordem_index: number;
  titulo: string;
  descricao: string | null;
};

type FormularioCampoPersistencia = {
  formulario_passo_id: number;
  ordem_index: number;
  nome: string;
  tipo_campo: TipoCampo;
  opcoes: string | null;
  max_fotos: number | null;
  obrigatorio: boolean;
  dica: string | null;
};

type FormularioCampoRow = {
  id: number;
  formulario_passo_id: number;
  ordem_index: number;
  nome: string;
  tipo_campo: TipoCampo;
  opcoes: string | null;
  max_fotos: number | null;
  obrigatorio: number;
  dica: string | null;
  data_criacao: string;
  data_update: string | null;
};

const rowToCampo = (row: FormularioCampoRow): FormularioCampo => ({
  id: row.id,
  formulario_passo_id: row.formulario_passo_id,
  ordem_index: row.ordem_index,
  nome: row.nome,
  tipo_campo: row.tipo_campo,
  tipo_campo_label: TIPOS_CAMPO_LABELS[row.tipo_campo],
  tipo_campo_aceita_opcoes: TIPO_CAMPO_ACEITA_OPCOES[row.tipo_campo],
  tipo_campo_tem_opcoes_padrao_nao_editaveis: TIPO_CAMPO_TEM_OPCOES_PADRAO_NAO_EDITAVEIS[row.tipo_campo],
  opcoes: row.opcoes ? JSON.parse(row.opcoes) : null,
  max_fotos: row.max_fotos,
  obrigatorio: Boolean(row.obrigatorio),
  dica: row.dica,
  data_criacao: row.data_criacao,
  data_update: row.data_update,
});

export class FormularioRepository {
  constructor(private db: Database) {}

  async profissaoExiste(id: number): Promise<boolean> {
    const row = await this.db.get<{ id: number }>(
      `SELECT id FROM profissao WHERE id = ? AND data_delete IS NULL`,
      id
    );
    return Boolean(row);
  }

  async passoExiste(id: number): Promise<boolean> {
    const row = await this.db.get<{ id: number }>(`SELECT id FROM formulario_passo WHERE id = ?`, id);
    return Boolean(row);
  }

  async buscarPassoPorId(id: number): Promise<FormularioPasso | undefined> {
    return this.db.get<FormularioPasso>(`SELECT * FROM formulario_passo WHERE id = ?`, id);
  }

  async listarPassosPorProfissao(profissaoId: number): Promise<FormularioPasso[]> {
    return this.db.all<FormularioPasso[]>(
      `SELECT * FROM formulario_passo WHERE profissao_id = ? ORDER BY ordem_index ASC`,
      profissaoId
    );
  }

  async proximaOrdemPasso(profissaoId: number): Promise<number> {
    const row = await this.db.get<{ max_ordem: number | null }>(
      `SELECT MAX(ordem_index) AS max_ordem FROM formulario_passo WHERE profissao_id = ?`,
      profissaoId
    );
    return (row?.max_ordem ?? 0) + 1;
  }

  async existePassoNaOrdem(profissaoId: number, ordemIndex: number, ignoreId?: number): Promise<boolean> {
    const row = await this.db.get<{ id: number }>(
      `SELECT id
         FROM formulario_passo
        WHERE profissao_id = ?
          AND ordem_index = ?
          ${ignoreId ? 'AND id != ?' : ''}
        LIMIT 1`,
      ...(ignoreId ? [profissaoId, ordemIndex, ignoreId] : [profissaoId, ordemIndex])
    );
    return Boolean(row);
  }

  async criarPasso(data: FormularioPassoPersistencia): Promise<FormularioPasso> {
    const result = await this.db.run(
      `INSERT INTO formulario_passo (profissao_id, ordem_index, titulo, descricao)
       VALUES (?, ?, ?, ?)`,
      data.profissao_id,
      data.ordem_index,
      data.titulo,
      data.descricao
    );

    const created = await this.buscarPassoPorId(result.lastID!);
    return created!;
  }

  async atualizarPasso(id: number, data: FormularioPassoPersistencia): Promise<FormularioPasso | undefined> {
    const existing = await this.buscarPassoPorId(id);
    if (!existing) return undefined;

    await this.db.run(
      `UPDATE formulario_passo
          SET profissao_id = ?,
              ordem_index = ?,
              titulo = ?,
              descricao = ?,
              data_update = CURRENT_TIMESTAMP
        WHERE id = ?`,
      data.profissao_id,
      data.ordem_index,
      data.titulo,
      data.descricao,
      id
    );

    return this.buscarPassoPorId(id);
  }

  async deletarPasso(id: number): Promise<boolean> {
    const result = await this.db.run(`DELETE FROM formulario_passo WHERE id = ?`, id);
    return (result.changes ?? 0) > 0;
  }

  async reorderPassos(profissaoId: number, itens: ReorderFormularioPassoItemDTO[]): Promise<void> {
    const fatorDeslocamento = 1000000;
    await this.db.exec('BEGIN');

    try {
      for (const item of itens) {
        await this.db.run(
          `UPDATE formulario_passo
              SET ordem_index = ordem_index + ?
            WHERE id = ? AND profissao_id = ?`,
          fatorDeslocamento,
          item.id,
          profissaoId
        );
      }

      for (const item of itens) {
        await this.db.run(
          `UPDATE formulario_passo
              SET ordem_index = ?,
                  data_update = CURRENT_TIMESTAMP
            WHERE id = ? AND profissao_id = ?`,
          item.ordem_index,
          item.id,
          profissaoId
        );
      }

      await this.db.exec('COMMIT');
    } catch (error) {
      await this.db.exec('ROLLBACK');
      throw error;
    }
  }

  async buscarCampoPorId(id: number): Promise<FormularioCampo | undefined> {
    const row = await this.db.get<FormularioCampoRow>(`SELECT * FROM formulario_campo WHERE id = ?`, id);
    return row ? rowToCampo(row) : undefined;
  }

  async listarCamposPorPasso(passoId: number): Promise<FormularioCampo[]> {
    const rows = await this.db.all<FormularioCampoRow[]>(
      `SELECT * FROM formulario_campo WHERE formulario_passo_id = ? ORDER BY ordem_index ASC`,
      passoId
    );
    return rows.map(rowToCampo);
  }

  async proximaOrdemCampo(passoId: number): Promise<number> {
    const row = await this.db.get<{ max_ordem: number | null }>(
      `SELECT MAX(ordem_index) AS max_ordem FROM formulario_campo WHERE formulario_passo_id = ?`,
      passoId
    );
    return (row?.max_ordem ?? 0) + 1;
  }

  async existeCampoNaOrdem(passoId: number, ordemIndex: number, ignoreId?: number): Promise<boolean> {
    const row = await this.db.get<{ id: number }>(
      `SELECT id
         FROM formulario_campo
        WHERE formulario_passo_id = ?
          AND ordem_index = ?
          ${ignoreId ? 'AND id != ?' : ''}
        LIMIT 1`,
      ...(ignoreId ? [passoId, ordemIndex, ignoreId] : [passoId, ordemIndex])
    );
    return Boolean(row);
  }

  async criarCampo(data: FormularioCampoPersistencia): Promise<FormularioCampo> {
    const result = await this.db.run(
      `INSERT INTO formulario_campo (
         formulario_passo_id,
         ordem_index,
         nome,
         tipo_campo,
         opcoes,
         max_fotos,
         obrigatorio,
         dica
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      data.formulario_passo_id,
      data.ordem_index,
      data.nome,
      data.tipo_campo,
      data.opcoes,
      data.max_fotos,
      data.obrigatorio ? 1 : 0,
      data.dica
    );

    const created = await this.buscarCampoPorId(result.lastID!);
    return created!;
  }

  async atualizarCampo(id: number, data: FormularioCampoPersistencia): Promise<FormularioCampo | undefined> {
    const existing = await this.buscarCampoPorId(id);
    if (!existing) return undefined;

    await this.db.run(
      `UPDATE formulario_campo
          SET formulario_passo_id = ?,
              ordem_index = ?,
              nome = ?,
              tipo_campo = ?,
              opcoes = ?,
              max_fotos = ?,
              obrigatorio = ?,
              dica = ?,
              data_update = CURRENT_TIMESTAMP
        WHERE id = ?`,
      data.formulario_passo_id,
      data.ordem_index,
      data.nome,
      data.tipo_campo,
      data.opcoes,
      data.max_fotos,
      data.obrigatorio ? 1 : 0,
      data.dica,
      id
    );

    return this.buscarCampoPorId(id);
  }

  async deletarCampo(id: number): Promise<boolean> {
    const result = await this.db.run(`DELETE FROM formulario_campo WHERE id = ?`, id);
    return (result.changes ?? 0) > 0;
  }

  async reorderCampos(passoId: number, itens: ReorderFormularioCampoItemDTO[]): Promise<void> {
    const fatorDeslocamento = 1000000;
    await this.db.exec('BEGIN');

    try {
      for (const item of itens) {
        await this.db.run(
          `UPDATE formulario_campo
              SET ordem_index = ordem_index + ?
            WHERE id = ? AND formulario_passo_id = ?`,
          fatorDeslocamento,
          item.id,
          passoId
        );
      }

      for (const item of itens) {
        await this.db.run(
          `UPDATE formulario_campo
              SET ordem_index = ?,
                  data_update = CURRENT_TIMESTAMP
            WHERE id = ? AND formulario_passo_id = ?`,
          item.ordem_index,
          item.id,
          passoId
        );
      }

      await this.db.exec('COMMIT');
    } catch (error) {
      await this.db.exec('ROLLBACK');
      throw error;
    }
  }
}
