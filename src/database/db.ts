import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/denuncias.db');

type ColumnInfo = { name: string; notnull: number; type: string };

async function columnExists(db: Database, table: string, column: string): Promise<boolean> {
  const rows = await db.all<ColumnInfo[]>(`PRAGMA table_info(${table});`);
  return rows.some((col) => col.name === column);
}

async function tableExists(db: Database, table: string): Promise<boolean> {
  const row = await db.get<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
    table
  );
  return Boolean(row);
}

async function runMigrations(db: Database) {
  await db.exec('PRAGMA foreign_keys = OFF;');
  await db.exec('BEGIN;');

  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS profissao (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE,
        descricao TEXT NOT NULL,
        cor TEXT NOT NULL,
        status INTEGER NOT NULL DEFAULT 1,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_update DATETIME,
        data_delete DATETIME
      );

      CREATE TABLE IF NOT EXISTS usuario_admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        refresh_token_hash TEXT,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_update DATETIME
      );
    `);

    const denunciasExists = await tableExists(db, 'denuncias');
    const hasProfissaoId = denunciasExists && await columnExists(db, 'denuncias', 'profissao_id');

    if (!hasProfissaoId) {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS denuncias_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          protocolo TEXT NOT NULL UNIQUE,
          data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
          regiao TEXT NOT NULL,
          profissao_id INTEGER,
          FOREIGN KEY (profissao_id) REFERENCES profissao(id)
        );

        ${denunciasExists ? `
          INSERT INTO denuncias_new (id, protocolo, data_criacao, regiao, profissao_id)
          SELECT 
            id,
            protocolo,
            data_criacao,
            regiao,
            NULL
          FROM denuncias;

          DROP TABLE denuncias;
        ` : ''}
        ALTER TABLE denuncias_new RENAME TO denuncias;
      `);
    }

    await db.exec('COMMIT;');
  } catch (error) {
    await db.exec('ROLLBACK;');
    throw error;
  } finally {
    await db.exec('PRAGMA foreign_keys = ON;');
  }
}

async function initializeDatabase(): Promise<Database> {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  await runMigrations(db);

  console.log('Banco de dados inicializado e migrações aplicadas');
  return db;
}

export default initializeDatabase();
