import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/denuncias.db');
const FORMULARIO_CAMPO_TIPOS = ['texto', 'textarea', 'numero', 'data', 'switch', 'select', 'radio', 'checkbox', 'foto'];
const FORMULARIO_CAMPO_TIPOS_SQL = FORMULARIO_CAMPO_TIPOS.map((tipo) => `'${tipo}'`).join(', ');
const FORMULARIO_CAMPO_MAX_FOTOS_CHECK = `
          CHECK (
            max_fotos IS NULL
            OR (typeof(max_fotos) = 'integer' AND max_fotos BETWEEN 1 AND 5)
          ),
          CHECK (
            (tipo_campo = 'foto' AND max_fotos IS NOT NULL)
            OR (tipo_campo != 'foto' AND max_fotos IS NULL)
          )
`;

type ColumnInfo = { name: string; notnull: number; type: string };
type ForeignKeyInfo = { table: string; from: string; on_delete: string };

async function columnExists(db: Database, table: string, column: string): Promise<boolean> {
  const rows = await db.all<ColumnInfo[]>(`PRAGMA table_info(${table});`);
  return rows.some((col) => col.name === column);
}

async function getColumnInfo(db: Database, table: string, column: string): Promise<ColumnInfo | undefined> {
  const rows = await db.all<ColumnInfo[]>(`PRAGMA table_info(${table});`);
  return rows.find((col) => col.name === column);
}

async function foreignKeyUsesOnDelete(
  db: Database,
  table: string,
  fromColumn: string,
  referencedTable: string,
  expectedAction: string
): Promise<boolean> {
  const rows = await db.all<ForeignKeyInfo[]>(`PRAGMA foreign_key_list(${table});`);
  return rows.some(
    (row) =>
      row.table === referencedTable &&
      row.from === fromColumn &&
      row.on_delete.toUpperCase() === expectedAction.toUpperCase()
  );
}

async function tableExists(db: Database, table: string): Promise<boolean> {
  const row = await db.get<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
    table
  );
  return Boolean(row);
}

async function sqlContains(db: Database, objectName: string, fragment: string): Promise<boolean> {
  const row = await db.get<{ sql: string | null }>(
    `SELECT sql FROM sqlite_master WHERE name = ?`,
    objectName
  );
  return row?.sql?.includes(fragment) ?? false;
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

      CREATE TABLE IF NOT EXISTS documentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profissao_id INTEGER NOT NULL,
        titulo TEXT NOT NULL,
        descricao TEXT,
        pontos_foco TEXT,
        url_online TEXT,
        arquivo TEXT,
        foto_capa TEXT,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_update DATETIME,
        FOREIGN KEY (profissao_id) REFERENCES profissao(id) ON DELETE CASCADE,
        CHECK (
          (url_online IS NOT NULL AND length(trim(url_online)) > 0)
          OR (arquivo IS NOT NULL AND length(trim(arquivo)) > 0)
        )
      );

      CREATE INDEX IF NOT EXISTS idx_documentos_profissao_id
        ON documentos (profissao_id);

      CREATE TABLE IF NOT EXISTS formulario_passo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profissao_id INTEGER NOT NULL,
        ordem_index INTEGER NOT NULL,
        titulo TEXT NOT NULL,
        descricao TEXT,
        data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        data_update DATETIME,
        FOREIGN KEY (profissao_id) REFERENCES profissao(id) ON DELETE CASCADE,
        UNIQUE (profissao_id, ordem_index)
      );

      CREATE TABLE IF NOT EXISTS formulario_campo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        formulario_passo_id INTEGER NOT NULL,
        ordem_index INTEGER NOT NULL,
        nome TEXT NOT NULL,
        tipo_campo TEXT NOT NULL CHECK (
          tipo_campo IN (${FORMULARIO_CAMPO_TIPOS_SQL})
        ),
        opcoes TEXT,
        max_fotos INTEGER,
        obrigatorio INTEGER NOT NULL DEFAULT 0 CHECK (obrigatorio IN (0, 1)),
        dica TEXT,
        data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        data_update DATETIME,
        ${FORMULARIO_CAMPO_MAX_FOTOS_CHECK},
        FOREIGN KEY (formulario_passo_id) REFERENCES formulario_passo(id) ON DELETE CASCADE,
        UNIQUE (formulario_passo_id, ordem_index)
      );

      CREATE INDEX IF NOT EXISTS idx_formulario_passo_profissao_ordem
        ON formulario_passo (profissao_id, ordem_index);

      CREATE INDEX IF NOT EXISTS idx_formulario_campo_passo_ordem
        ON formulario_campo (formulario_passo_id, ordem_index);

      CREATE TRIGGER IF NOT EXISTS trg_formulario_passo_data_update
      AFTER UPDATE ON formulario_passo
      FOR EACH ROW
      BEGIN
        UPDATE formulario_passo
           SET data_update = CURRENT_TIMESTAMP
         WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS trg_formulario_campo_data_update
      AFTER UPDATE ON formulario_campo
      FOR EACH ROW
      BEGIN
        UPDATE formulario_campo
           SET data_update = CURRENT_TIMESTAMP
         WHERE id = OLD.id;
      END;
    `);

    const profissaoDescricaoInfo = await getColumnInfo(db, 'profissao', 'descricao');

    if (profissaoDescricaoInfo?.notnull) {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS profissao_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL UNIQUE,
          descricao TEXT,
          cor TEXT NOT NULL,
          status INTEGER NOT NULL DEFAULT 1,
          data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
          data_update DATETIME,
          data_delete DATETIME
        );

        INSERT INTO profissao_new (id, nome, descricao, cor, status, data_criacao, data_update, data_delete)
        SELECT id, nome, descricao, cor, status, data_criacao, data_update, data_delete
          FROM profissao;

        DROP TABLE profissao;
        ALTER TABLE profissao_new RENAME TO profissao;
      `);
    }

    const denunciasExists = await tableExists(db, 'denuncias');
    const hasProfissaoId = denunciasExists && await columnExists(db, 'denuncias', 'profissao_id');
    const denunciaFkSetNull =
      denunciasExists &&
      hasProfissaoId &&
      await foreignKeyUsesOnDelete(db, 'denuncias', 'profissao_id', 'profissao', 'SET NULL');

    if (!hasProfissaoId || !denunciaFkSetNull) {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS denuncias_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          protocolo TEXT NOT NULL UNIQUE,
          data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
          regiao TEXT NOT NULL,
          profissao_id INTEGER,
          FOREIGN KEY (profissao_id) REFERENCES profissao(id) ON DELETE SET NULL
        );

        ${denunciasExists ? `
          INSERT INTO denuncias_new (id, protocolo, data_criacao, regiao, profissao_id)
          SELECT 
            id,
            protocolo,
            data_criacao,
            regiao,
            ${hasProfissaoId ? 'profissao_id' : 'NULL'}
          FROM denuncias;

          DROP TABLE denuncias;
        ` : ''}
        ALTER TABLE denuncias_new RENAME TO denuncias;
      `);
    }

    const documentosExists = await tableExists(db, 'documentos');
    const documentoFkCascade =
      documentosExists &&
      await foreignKeyUsesOnDelete(db, 'documentos', 'profissao_id', 'profissao', 'CASCADE');

    if (documentosExists && !documentoFkCascade) {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS documentos_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          profissao_id INTEGER NOT NULL,
          titulo TEXT NOT NULL,
          descricao TEXT,
          pontos_foco TEXT,
          url_online TEXT,
          arquivo TEXT,
          foto_capa TEXT,
          data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
          data_update DATETIME,
          FOREIGN KEY (profissao_id) REFERENCES profissao(id) ON DELETE CASCADE,
          CHECK (
            (url_online IS NOT NULL AND length(trim(url_online)) > 0)
            OR (arquivo IS NOT NULL AND length(trim(arquivo)) > 0)
          )
        );

        INSERT INTO documentos_new (id, profissao_id, titulo, descricao, pontos_foco, url_online, arquivo, foto_capa, data_criacao, data_update)
        SELECT id, profissao_id, titulo, descricao, pontos_foco, url_online, arquivo, foto_capa, data_criacao, data_update
          FROM documentos;

        DROP TABLE documentos;
        ALTER TABLE documentos_new RENAME TO documentos;

        CREATE INDEX IF NOT EXISTS idx_documentos_profissao_id
          ON documentos (profissao_id);
      `);
    }

    const formularioCampoExists = await tableExists(db, 'formulario_campo');
    const formularioCampoConstraintFragment = `tipo_campo IN (${FORMULARIO_CAMPO_TIPOS_SQL})`;
    const formularioCampoTemMaxFotos = formularioCampoExists && await columnExists(db, 'formulario_campo', 'max_fotos');
    const formularioCampoTemCheckFoto =
      formularioCampoExists &&
      await sqlContains(db, 'formulario_campo', "(tipo_campo = 'foto' AND max_fotos IS NOT NULL)");
    const formularioCampoMaxFotosSelect = formularioCampoTemMaxFotos ? 'max_fotos' : 'NULL';
    const formularioCampoConstraintAtualizado =
      formularioCampoExists &&
      formularioCampoTemMaxFotos &&
      formularioCampoTemCheckFoto &&
      await sqlContains(db, 'formulario_campo', formularioCampoConstraintFragment);

    if (formularioCampoExists && !formularioCampoConstraintAtualizado) {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS formulario_campo_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          formulario_passo_id INTEGER NOT NULL,
          ordem_index INTEGER NOT NULL,
          nome TEXT NOT NULL,
          tipo_campo TEXT NOT NULL CHECK (
            tipo_campo IN (${FORMULARIO_CAMPO_TIPOS_SQL})
          ),
          opcoes TEXT,
          max_fotos INTEGER,
          obrigatorio INTEGER NOT NULL DEFAULT 0 CHECK (obrigatorio IN (0, 1)),
          dica TEXT,
          data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          data_update DATETIME,
          ${FORMULARIO_CAMPO_MAX_FOTOS_CHECK},
          FOREIGN KEY (formulario_passo_id) REFERENCES formulario_passo(id) ON DELETE CASCADE,
          UNIQUE (formulario_passo_id, ordem_index)
        );

        INSERT INTO formulario_campo_new (
          id,
          formulario_passo_id,
          ordem_index,
          nome,
          tipo_campo,
          opcoes,
          max_fotos,
          obrigatorio,
          dica,
          data_criacao,
          data_update
        )
        SELECT
          id,
          formulario_passo_id,
          ROW_NUMBER() OVER (
            PARTITION BY formulario_passo_id
            ORDER BY ordem_index ASC, id ASC
          ),
          nome,
          CASE
            WHEN tipo_campo = 'email' THEN 'texto'
            ELSE tipo_campo
          END,
          opcoes,
          CASE
            WHEN (
              CASE
                WHEN tipo_campo = 'email' THEN 'texto'
                ELSE tipo_campo
              END
            ) = 'foto'
              THEN ${formularioCampoMaxFotosSelect}
            ELSE NULL
          END,
          obrigatorio,
          dica,
          data_criacao,
          data_update
        FROM formulario_campo
        WHERE tipo_campo NOT IN ('bairro', 'cep');

        DROP TABLE formulario_campo;
        ALTER TABLE formulario_campo_new RENAME TO formulario_campo;

        CREATE INDEX IF NOT EXISTS idx_formulario_campo_passo_ordem
          ON formulario_campo (formulario_passo_id, ordem_index);

        CREATE TRIGGER IF NOT EXISTS trg_formulario_campo_data_update
        AFTER UPDATE ON formulario_campo
        FOR EACH ROW
        BEGIN
          UPDATE formulario_campo
             SET data_update = CURRENT_TIMESTAMP
           WHERE id = OLD.id;
        END;
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
