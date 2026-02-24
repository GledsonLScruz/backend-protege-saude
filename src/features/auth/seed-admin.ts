import { Database } from 'sqlite';
import { UsuarioAdminRepository } from './usuario-admin-repository';
import { hashSenha } from './password-hash';

type SeedUser = {
  usuario: string;
  senha: string;
};

type SeedAdminOptions = {
  db: Database;
  updateExisting?: boolean;
  requireEnv?: boolean;
};

export type SeedAdminResult = {
  created: number;
  updated: number;
  skipped: number;
  total: number;
};

export const SEED_USERS_ENV_VAR = 'USUARIO_ADMIN_SEED_JSON';

export function loadSeedUsersFromEnv(requireEnv = true): SeedUser[] {
  const envValue = process.env[SEED_USERS_ENV_VAR]?.trim();

  if (!envValue) {
    if (!requireEnv) return [];
    throw new Error(
      `Variável ${SEED_USERS_ENV_VAR} não definida. Exemplo: [{"usuario":"admin","senha":"senhaSegura"}].`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(envValue);
  } catch {
    throw new Error(`Variável ${SEED_USERS_ENV_VAR} contém JSON inválido.`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('O JSON precisa ser um array de objetos { usuario, senha }.');
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== 'object' || !('usuario' in item) || !('senha' in item)) {
      throw new Error(`Item ${index} inválido: faltando "usuario" ou "senha".`);
    }

    const usuario = String((item as { usuario: unknown }).usuario).trim();
    const senha = String((item as { senha: unknown }).senha);

    if (!usuario || !senha) {
      throw new Error(`Item ${index} inválido: "usuario" e "senha" devem ser não vazios.`);
    }

    return { usuario, senha };
  });
}

export async function seedAdminUsersFromEnv(options: SeedAdminOptions): Promise<SeedAdminResult> {
  const { db, updateExisting = false, requireEnv = true } = options;
  const users = loadSeedUsersFromEnv(requireEnv);
  const repo = new UsuarioAdminRepository(db);

  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const user of users) {
    const exists = await repo.findByUsuario(user.usuario);

    if (exists) {
      if (updateExisting) {
        await repo.updatePasswordAndResetRefresh(exists.id!, hashSenha(user.senha));
        updated += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    await repo.create(user.usuario, hashSenha(user.senha));
    created += 1;
  }

  return {
    created,
    updated,
    skipped,
    total: users.length
  };
}
