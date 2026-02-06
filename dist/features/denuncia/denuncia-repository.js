"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DenunciaRepository = void 0;
class DenunciaRepository {
    constructor(db) {
        this.db = db;
    }
    async criar(denuncia) {
        const { protocolo, regiao } = denuncia;
        const result = await this.db.run(`INSERT INTO denuncias (protocolo, regiao) 
       VALUES (?, ?)`, [protocolo, regiao]);
        return result.lastID;
    }
    async buscarPorId(id) {
        return this.db.get('SELECT * FROM denuncias WHERE id = ?', [id]);
    }
    async listar(pagina = 1, itensPorPagina = 10) {
        const offset = (pagina - 1) * itensPorPagina;
        return this.db.all(`SELECT * FROM denuncias 
       ORDER BY data_criacao DESC 
       LIMIT ? OFFSET ?`, [itensPorPagina, offset]);
    }
    async listarTodas() {
        return this.db.all(`SELECT * FROM denuncias 
     ORDER BY data_criacao DESC`);
    }
    async relatorioPorRegiao() {
        return this.db.all(`SELECT regiao, COUNT(*) as total 
       FROM denuncias 
       GROUP BY regiao 
       ORDER BY total DESC`);
    }
    async relatorioPorPeriodo(inicio, fim) {
        return this.db.all(`SELECT strftime('%Y-%m-%d', data_criacao) as data, 
              COUNT(*) as total 
       FROM denuncias 
       WHERE data_criacao BETWEEN ? AND ?
       GROUP BY strftime('%Y-%m-%d', data_criacao)`, [inicio, fim]);
    }
}
exports.DenunciaRepository = DenunciaRepository;
