import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
// Execute: npm run criar-gestor -- "Nome" email@exemplo.com "SenhaForte123" 1
async function main() {
  const [nome, email, senha, municipioTexto] = process.argv.slice(2);
  const municipioId = Number(municipioTexto);
  if (!nome || !email || !senha || senha.length < 10 || senha.length > 72 || !Number.isInteger(municipioId) || municipioId <= 0) {
    throw new Error('Uso: npm run criar-gestor -- "Nome" email@dominio.com "SenhaCom10Caracteres" 1');
  }
  const hash = await bcrypt.hash(senha, 12);
  await pool.query(`INSERT INTO usuarios (nome, email, senha_hash, municipio_id, perfil)
    VALUES ($1, LOWER($2), $3, $4, 'gestor')`, [nome, email, hash, municipioId]);
  console.log('Gestor criado. Faça login na aplicação.');
}
main().catch(erro => { console.error(erro.message); process.exitCode = 1; }).finally(() => pool.end());
