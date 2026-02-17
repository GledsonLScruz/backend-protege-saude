import { Database } from 'sqlite';
import { Documento } from './@types';

type DocumentoPersistencia = {
  profissao_id: number;
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
      `SELECT * FROM documentos WHERE profissao_id = ? ORDER BY data_criacao DESC`,
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
        titulo,
        descricao,
        pontos_foco,
        url_online,
        arquivo,
        foto_capa
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      data.profissao_id,
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
             titulo = ?,
             descricao = ?,
             pontos_foco = ?,
             url_online = ?,
             arquivo = ?,
             foto_capa = ?,
             data_update = CURRENT_TIMESTAMP
       WHERE id = ?`,
      data.profissao_id,
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
}

