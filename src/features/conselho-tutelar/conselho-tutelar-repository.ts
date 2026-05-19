import { Database } from 'sqlite';
import { AtualizarConselhoTutelarDTO, ConselhoTutelar, CriarConselhoTutelarDTO } from './@types';
import { normalizarBuscaLocalidade } from '../localidades/localidades-service';

type ConselhoTutelarRow = Omit<ConselhoTutelar, 'bairros'> & {
  bairros: string;
};

const normalizarBusca = (value: string): string => {
  return normalizarBuscaLocalidade(value);
};

const deserializarConselho = (row: ConselhoTutelarRow): ConselhoTutelar => {
  let bairros: string[] = [];
  try {
    const parsed = JSON.parse(row.bairros);
    bairros = Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch (_error) {
    bairros = [];
  }

  return {
    ...row,
    bairros,
  };
};

export class ConselhoTutelarRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<ConselhoTutelar[]> {
    const rows = await this.db.all<ConselhoTutelarRow[]>(
      `SELECT * FROM conselho_tutelar ORDER BY cidade ASC, nome ASC`
    );
    return rows.map(deserializarConselho);
  }

  async findById(id: number): Promise<ConselhoTutelar | undefined> {
    const row = await this.db.get<ConselhoTutelarRow>(
      `SELECT * FROM conselho_tutelar WHERE id = ?`,
      id
    );
    return row ? deserializarConselho(row) : undefined;
  }

  async findByCidade(cidade: string): Promise<ConselhoTutelar | undefined> {
    const row = await this.db.get<ConselhoTutelarRow>(
      `SELECT * FROM conselho_tutelar WHERE lower(cidade) = lower(?) ORDER BY nome ASC LIMIT 1`,
      cidade
    );
    return row ? deserializarConselho(row) : undefined;
  }

  async search(termo: string): Promise<ConselhoTutelar[]> {
    const termoBusca = `%${termo.trim().toLowerCase()}%`;
    const rows = await this.db.all<ConselhoTutelarRow[]>(
      `SELECT * FROM conselho_tutelar
       WHERE lower(nome) LIKE ?
          OR lower(email) LIKE ?
          OR lower(cidade) LIKE ?
          OR lower(estado) LIKE ?
          OR lower(bairros) LIKE ?
       ORDER BY cidade ASC, nome ASC`,
      termoBusca,
      termoBusca,
      termoBusca,
      termoBusca,
      termoBusca
    );
    return rows.map(deserializarConselho);
  }

  async criar(data: CriarConselhoTutelarDTO): Promise<ConselhoTutelar> {
    const result = await this.db.run(
      `INSERT INTO conselho_tutelar (nome, email, cidade, estado, bairros)
       VALUES (?, ?, ?, ?, ?)`,
      data.nome,
      data.email,
      data.cidade,
      data.estado,
      JSON.stringify(data.bairros)
    );

    const criado = await this.findById(result.lastID!);
    return criado!;
  }

  async atualizar(id: number, data: AtualizarConselhoTutelarDTO): Promise<ConselhoTutelar | undefined> {
    const atual = await this.findById(id);
    if (!atual) return undefined;

    await this.db.run(
      `UPDATE conselho_tutelar
          SET nome = ?, email = ?, cidade = ?, estado = ?, bairros = ?
        WHERE id = ?`,
      data.nome,
      data.email,
      data.cidade,
      data.estado,
      JSON.stringify(data.bairros),
      id
    );

    return this.findById(id);
  }

  async deletar(id: number): Promise<boolean> {
    const result = await this.db.run(`DELETE FROM conselho_tutelar WHERE id = ?`, id);
    return Boolean(result.changes);
  }

  async bairroJaVinculado(
    cidade: string,
    estado: string,
    bairro: string,
    ignorarConselhoId?: number
  ): Promise<ConselhoTutelar | undefined> {
    const conselhos = await this.findAll();
    const cidadeBusca = normalizarBusca(cidade);
    const estadoBusca = normalizarBusca(estado);
    const bairroBusca = normalizarBusca(bairro);

    return conselhos.find((conselho) => (
      conselho.id !== ignorarConselhoId &&
      normalizarBusca(conselho.cidade) === cidadeBusca &&
      normalizarBusca(conselho.estado) === estadoBusca &&
      conselho.bairros.some((item) => normalizarBusca(item) === bairroBusca)
    ));
  }

  async encontrarPorEndereco(cidade: string, estado: string, bairro: string): Promise<ConselhoTutelar | undefined> {
    return this.bairroJaVinculado(cidade, estado, bairro);
  }
}
