import { Database } from 'sqlite';
import { UsuarioAdmin } from './@types';

export class UsuarioAdminRepository {
  constructor(private db: Database) {}

  async findByUsuario(usuario: string): Promise<UsuarioAdmin | undefined> {
    return this.db.get<UsuarioAdmin>(
      `SELECT * FROM usuario_admin WHERE usuario = ?`,
      usuario
    );
  }

  async findById(id: number): Promise<UsuarioAdmin | undefined> {
    return this.db.get<UsuarioAdmin>(
      `SELECT * FROM usuario_admin WHERE id = ?`,
      id
    );
  }

  async create(usuario: string, senhaHash: string): Promise<UsuarioAdmin> {
    const result = await this.db.run(
      `INSERT INTO usuario_admin (usuario, senha_hash) VALUES (?, ?)`,
      usuario,
      senhaHash
    );
    return this.db.get<UsuarioAdmin>(
      `SELECT * FROM usuario_admin WHERE id = ?`,
      result.lastID
    ) as Promise<UsuarioAdmin>;
  }

  async updateRefreshTokenHash(id: number, refreshHash: string | null) {
    await this.db.run(
      `UPDATE usuario_admin SET refresh_token_hash = ?, data_update = CURRENT_TIMESTAMP WHERE id = ?`,
      refreshHash,
      id
    );
  }

  async updatePasswordAndResetRefresh(id: number, senhaHash: string) {
    await this.db.run(
      `UPDATE usuario_admin 
         SET senha_hash = ?, refresh_token_hash = NULL, data_update = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      senhaHash,
      id
    );
  }
}
