import { Database } from 'sqlite';
import { Denuncia, EnviarDenunciaRequest } from './@types';

export class DenunciaRepository {
  constructor(private db: Database) { }

  async criar(denuncia: Partial<EnviarDenunciaRequest>): Promise<number> {
    const { protocolo, regiao, profissao_id } = denuncia;

    const result = await this.db.run(
      `INSERT INTO denuncias (protocolo, regiao, profissao_id) 
       VALUES (?, ?, ?)`,
      [protocolo, regiao, profissao_id ?? null]
    );

    return result.lastID!
  }

  async buscarPorId(id: number): Promise<Denuncia | undefined> {
    return this.db.get<Denuncia>(
      'SELECT * FROM denuncias WHERE id = ?',
      [id]
    );
  }

  async listar(pagina: number = 1, itensPorPagina: number = 10): Promise<Denuncia[]> {
    const offset = (pagina - 1) * itensPorPagina;
    return this.db.all<Denuncia[]>(
      `SELECT * FROM denuncias 
       ORDER BY data_criacao DESC 
       LIMIT ? OFFSET ?`,
      [itensPorPagina, offset]
    );
  }

  async listarTodas(): Promise<Denuncia[]> {
    return this.db.all<Denuncia[]>(
      `SELECT * FROM denuncias 
     ORDER BY data_criacao DESC`
    );
  }

  async relatorioPorRegiao(): Promise<{ regiao: string; total: number }[]> {
    return this.db.all(
      `SELECT regiao, COUNT(*) as total 
       FROM denuncias 
       GROUP BY regiao 
       ORDER BY total DESC`
    );
  }

  async relatorioPorPeriodo(inicio: string, fim: string): Promise<{ data: string; total: number }[]> {
    return this.db.all(
      `SELECT strftime('%Y-%m-%d', data_criacao) as data, 
              COUNT(*) as total 
       FROM denuncias 
       WHERE data_criacao BETWEEN ? AND ?
       GROUP BY strftime('%Y-%m-%d', data_criacao)`,
      [inicio, fim]
    );
  }
}
