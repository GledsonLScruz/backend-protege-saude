"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfissaoRepository = void 0;
class ProfissaoRepository {
    constructor(db) {
        this.db = db;
    }
    async listar() {
        return this.db.all(`
      SELECT * FROM profissao
      WHERE data_delete IS NULL
      ORDER BY nome ASC
    `);
    }
    async buscarPorId(id) {
        return this.db.get(`SELECT * FROM profissao WHERE id = ? AND data_delete IS NULL`, id);
    }
    async criar(data) {
        const status = data.status ?? 1;
        const result = await this.db.run(`INSERT INTO profissao (nome, descricao, cor, status)
       VALUES (?, ?, ?, ?)`, data.nome, data.descricao, data.cor, status);
        const criado = await this.buscarPorId(result.lastID);
        return criado;
    }
    async atualizar(id, data) {
        const atual = await this.buscarPorId(id);
        if (!atual)
            return undefined;
        const nome = data.nome ?? atual.nome;
        const descricao = data.descricao ?? atual.descricao;
        const cor = data.cor ?? atual.cor;
        const status = data.status ?? atual.status;
        await this.db.run(`UPDATE profissao
         SET nome = ?, descricao = ?, cor = ?, status = ?, data_update = CURRENT_TIMESTAMP
       WHERE id = ?`, nome, descricao, cor, status, id);
        return this.buscarPorId(id);
    }
    async alterarStatus(id, status) {
        const atual = await this.buscarPorId(id);
        if (!atual)
            return undefined;
        await this.db.run(`UPDATE profissao
         SET status = ?, data_update = CURRENT_TIMESTAMP
       WHERE id = ?`, status, id);
        return this.buscarPorId(id);
    }
}
exports.ProfissaoRepository = ProfissaoRepository;
