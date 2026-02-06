import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import dbPromise from '../src/database/db';
import { UsuarioAdminRepository } from '../src/features/auth/usuario-admin-repository';
import { hashSenha } from '../src/features/auth/password-hash';

dotenv.config();

type SeedUser = {
  usuario: string;
  senha: string;
};

const DEFAULT_FILE = path.join(__dirname, '../data/usuario-admin-seed.json');

function loadUsers(filePath: string): SeedUser[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Arquivo "${filePath}" não encontrado. Crie um JSON com [{"usuario":"admin","senha":"senhaSegura"}].`
    );
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(content);

  if (!Array.isArray(parsed)) {
    throw new Error('O JSON precisa ser um array de objetos { usuario, senha }.');
  }

  return parsed.map((item, index) => {
    if (!item?.usuario || !item?.senha) {
      throw new Error(`Item ${index} inválido: faltando "usuario" ou "senha".`);
    }
    return { usuario: String(item.usuario).trim(), senha: String(item.senha) };
  });
}

async function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find((a) => !a.startsWith('--'));
  const shouldUpdateExisting = args.includes('--update');
  const filePath = fileArg ? path.resolve(process.cwd(), fileArg) : DEFAULT_FILE;

  console.log(`🔎 Usando arquivo: ${filePath}`);

  const users = loadUsers(filePath);
  const db = await dbPromise;
  const repo = new UsuarioAdminRepository(db);

  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const user of users) {
    const exists = await repo.findByUsuario(user.usuario);
    if (exists) {
      if (shouldUpdateExisting) {
        const senhaHash = hashSenha(user.senha);
        await repo.updatePasswordAndResetRefresh(exists.id!, senhaHash);
        console.log(`🔄 Atualizado senha e resetado tokens de "${user.usuario}".`);
        updated += 1;
      } else {
        console.log(`↩️  Pulando "${user.usuario}" (já existe). Use --update para atualizar senha/resetar tokens.`);
        skipped += 1;
      }
    } else {
      const senhaHash = hashSenha(user.senha);
      await repo.create(user.usuario, senhaHash);
      console.log(`✅ Criado usuário "${user.usuario}".`);
      created += 1;
    }
  }

  console.log('---');
  console.log(
    `Concluído. Criados: ${created}. Atualizados: ${updated}. Pulados: ${skipped}. Total lido: ${users.length}.`
  );
  if (shouldUpdateExisting && updated > 0) {
    console.log('Obs: tokens antigos foram invalidados; faça login novamente para obter novos.');
  }
}

main().catch((err) => {
  console.error('Erro ao popular usuarios admin:', err.message || err);
  process.exit(1);
});
