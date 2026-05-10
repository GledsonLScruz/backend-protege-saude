import { Database } from 'sqlite';
import { Documento, ReorderDocumentoItemDTO } from './@types';

type DocumentoPersistencia = {
  profissao_id: number;
  ordem_index: number;
  titulo: string;
  descricao: string | null;
  pontos_foco: string | null;
  url_online: string | null;
  arquivo: string | null;
  foto_capa: string | null;
};

export class DocumentoRepository {
  constructor(private db: Database) {}

  async profissaoExiste(id: number): Promise<boolean> {
    const row = await this.db.get<{ id: number }>(
      `SELECT id FROM profissao WHERE id = ? AND data_delete IS NULL`,
      id
    );
    return Boolean(row);
  }

  async listarPorProfissao(profissaoId: number): Promise<Documento[]> {
    return this.db.all<Documento[]>(
      `SELECT * FROM documentos WHERE profissao_id = ? ORDER BY ordem_index ASC`,
      profissaoId
    );
  }

  async buscarPorId(id: number): Promise<Documento | undefined> {
    return this.db.get<Documento>(`SELECT * FROM documentos WHERE id = ?`, id);
  }

  async criar(data: DocumentoPersistencia): Promise<Documento> {
    const result = await this.db.run(
      `INSERT INTO documentos (
        profissao_id,
        ordem_index,
        titulo,
        descricao,
        pontos_foco,
        url_online,
        arquivo,
        foto_capa
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      data.profissao_id,
      data.ordem_index,
      data.titulo,
      data.descricao,
      data.pontos_foco,
      data.url_online,
      data.arquivo,
      data.foto_capa
    );

    const criado = await this.buscarPorId(result.lastID!);
    return criado!;
  }

  async atualizar(id: number, data: DocumentoPersistencia): Promise<Documento | undefined> {
    const atual = await this.buscarPorId(id);
    if (!atual) return undefined;

    await this.db.run(
      `UPDATE documentos
         SET profissao_id = ?,
             ordem_index = ?,
             titulo = ?,
             descricao = ?,
             pontos_foco = ?,
             url_online = ?,
             arquivo = ?,
             foto_capa = ?,
             data_update = CURRENT_TIMESTAMP
      WHERE id = ?`,
      data.profissao_id,
      data.ordem_index,
      data.titulo,
      data.descricao,
      data.pontos_foco,
      data.url_online,
      data.arquivo,
      data.foto_capa,
      id
    );

    return this.buscarPorId(id);
  }

  async deletar(id: number): Promise<boolean> {
    const result = await this.db.run(`DELETE FROM documentos WHERE id = ?`, id);
    return (result.changes ?? 0) > 0;
  }

  async proximaOrdem(profissaoId: number): Promise<number> {
    const row = await this.db.get<{ max_ordem: number | null }>(
      `SELECT MAX(ordem_index) AS max_ordem FROM documentos WHERE profissao_id = ?`,
      profissaoId
    );
    return (row?.max_ordem ?? 0) + 1;
  }

  async existeNaOrdem(profissaoId: number, ordemIndex: number, ignoreId?: number): Promise<boolean> {
    const row = await this.db.get<{ id: number }>(
      `SELECT id
         FROM documentos
        WHERE profissao_id = ?
          AND ordem_index = ?
          ${ignoreId ? 'AND id != ?' : ''}
        LIMIT 1`,
      ...(ignoreId ? [profissaoId, ordemIndex, ignoreId] : [profissaoId, ordemIndex])
    );
    return Boolean(row);
  }

  async reorder(profissaoId: number, itens: ReorderDocumentoItemDTO[]): Promise<void> {
    const fatorDeslocamento = 1000000;
    await this.db.exec('BEGIN');

    try {
      for (const item of itens) {
        await this.db.run(
          `UPDATE documentos
              SET ordem_index = ordem_index + ?
            WHERE id = ? AND profissao_id = ?`,
          fatorDeslocamento,
          item.id,
          profissaoId
        );
      }

      for (const item of itens) {
        await this.db.run(
          `UPDATE documentos
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
}
