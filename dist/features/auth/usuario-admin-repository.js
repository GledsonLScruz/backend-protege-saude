"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioAdminRepository = void 0;
class UsuarioAdminRepository {
    constructor(db) {
        this.db = db;
    }
    async findByUsuario(usuario) {
        return this.db.get(`SELECT * FROM usuario_admin WHERE usuario = ?`, usuario);
    }
    async findById(id) {
        return this.db.get(`SELECT * FROM usuario_admin WHERE id = ?`, id);
    }
    async create(usuario, senhaHash) {
        const result = await this.db.run(`INSERT INTO usuario_admin (usuario, senha_hash) VALUES (?, ?)`, usuario, senhaHash);
        return this.db.get(`SELECT * FROM usuario_admin WHERE id = ?`, result.lastID);
    }
    async updateRefreshTokenHash(id, refreshHash) {
        await this.db.run(`UPDATE usuario_admin SET refresh_token_hash = ?, data_update = CURRENT_TIMESTAMP WHERE id = ?`, refreshHash, id);
    }
    async updatePasswordAndResetRefresh(id, senhaHash) {
        await this.db.run(`UPDATE usuario_admin 
         SET senha_hash = ?, refresh_token_hash = NULL, data_update = CURRENT_TIMESTAMP 
       WHERE id = ?`, senhaHash, id);
    }
}
exports.UsuarioAdminRepository = UsuarioAdminRepository;
