import dotenv from 'dotenv';
import dbPromise from '../src/database/db';
import { seedAdminUsersFromEnv, SEED_USERS_ENV_VAR } from '../src/features/auth/seed-admin';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  const shouldUpdateExisting = args.includes('--update');
  const unsupportedArgs = args.filter((a) => a !== '--update');

  if (unsupportedArgs.length > 0) {
    throw new Error(`Argumentos não suportados: ${unsupportedArgs.join(' ')}. Use apenas --update.`);
  }

  console.log(`🔎 Lendo usuários da variável de ambiente: ${SEED_USERS_ENV_VAR}`);

  const db = await dbPromise;
  const result = await seedAdminUsersFromEnv({
    db,
    updateExisting: shouldUpdateExisting,
    requireEnv: true
  });

  console.log('---');
  console.log(
    `Concluído. Criados: ${result.created}. Atualizados: ${result.updated}. Pulados: ${result.skipped}. Total lido: ${result.total}.`
  );
  if (shouldUpdateExisting && result.updated > 0) {
    console.log('Obs: tokens antigos foram invalidados; faça login novamente para obter novos.');
  }
}

main().catch((err) => {
  console.error('Erro ao popular usuarios admin:', err.message || err);
  process.exit(1);
});
