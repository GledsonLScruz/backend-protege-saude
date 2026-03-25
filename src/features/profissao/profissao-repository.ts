import { Database } from 'sqlite';
import { AtualizarProfissaoDTO, CriarProfissaoDTO, Profissao } from './@types';
import { Documento } from '../documento/@types';

export class ProfissaoRepository {
  constructor(private db: Database) {}

  async listar(): Promise<Profissao[]> {
    return this.db.all<Profissao[]>(`
      SELECT * FROM profissao
      WHERE data_delete IS NULL
      ORDER BY nome ASC
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
      `SELECT * FROM profissao WHERE id = ? AND data_delete IS NULL`,
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

  async criar(data: CriarProfissaoDTO): Promise<Profissao> {
    const status = data.status ?? 1;
    const result = await this.db.run(
      `INSERT INTO profissao (nome, descricao, cor, status)
       VALUES (?, ?, ?, ?)`,
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
         SET nome = ?, descricao = ?, cor = ?, status = ?, data_update = CURRENT_TIMESTAMP
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
         SET status = ?, data_update = CURRENT_TIMESTAMP
       WHERE id = ?`,
      status,
      id
    );

    return this.buscarPorId(id);
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
}
