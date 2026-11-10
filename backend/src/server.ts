import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './config/database.js';
import { ocorrenciasRouter } from './ocorrencias.js';
import { interacoesRouter } from './interacoes.js';
import { notificacoesRouter } from './notificacoes.js';
import { gestorRouter } from './gestor.js';
import path from 'node:path';
import { autenticar, criarToken, exigirGestor } from './auth.js';
const app = express();
const porta = Number(process.env.PORT) || 3000;
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json({ limit: '20kb' }));
app.use('/uploads', express.static(path.resolve('uploads')));
app.use('/api/ocorrencias', interacoesRouter);
app.use('/api/ocorrencias', ocorrenciasRouter);
app.use('/api/notificacoes', notificacoesRouter);
app.use('/api/gestor', gestorRouter);
app.get('/api/health', (_req, res) => { res.json({ mensagem: 'API do NekoUrban funcionando!' }); });
app.get('/api/municipios', async (_req, res) => {
  try { const r = await pool.query('SELECT id, nome, uf FROM municipios WHERE ativo = TRUE ORDER BY nome'); res.json(r.rows); }
  catch { res.status(500).json({ erro: 'Erro ao consultar municípios.' }); }
});
app.get('/api/categorias', async (_req, res) => {
  try { const r = await pool.query('SELECT id, nome FROM categorias ORDER BY id'); res.json(r.rows); }
  catch { res.status(500).json({ erro: 'Erro ao consultar categorias.' }); }
});
// O cadastro público sempre cria cidadão; gestor só via script administrativo.
app.post('/api/auth/cadastro', async (req, res) => {
  const { nome, email, senha, municipioId } = req.body ?? {};
  if (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 120 ||
      typeof email !== 'string' || email.length > 180 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof senha !== 'string' || senha.length < 10 || senha.length > 72 || !Number.isInteger(municipioId)) {
    res.status(400).json({ erro: 'Informe nome, e-mail válido, senha de 10 a 72 caracteres e município.' }); return;
  }
  try {
    const m = await pool.query('SELECT id FROM municipios WHERE id = $1 AND ativo = TRUE', [municipioId]);
    if (!m.rowCount) { res.status(400).json({ erro: 'Município inválido.' }); return; }
    const hash = await bcrypt.hash(senha, 12);
    const r = await pool.query(`INSERT INTO usuarios (nome, email, senha_hash, municipio_id, perfil)
      VALUES ($1, LOWER($2), $3, $4, 'cidadao')
      RETURNING id, nome, email, municipio_id AS "municipioId", perfil`, [nome.trim(), email.trim(), hash, municipioId]);
    res.status(201).json({ mensagem: 'Conta criada com sucesso.', usuario: r.rows[0] });
  } catch (erro: unknown) {
    if (typeof erro === 'object' && erro !== null && 'code' in erro && erro.code === '23505') {
      res.status(409).json({ erro: 'E-mail já cadastrado.' }); return;
    }
    console.error(erro); res.status(500).json({ erro: 'Não foi possível realizar o cadastro.' });
  }
});
app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body ?? {};
  if (typeof email !== 'string' || typeof senha !== 'string') { res.status(400).json({ erro: 'Informe e-mail e senha.' }); return; }
  try {
    const r = await pool.query(`SELECT id, nome, email, senha_hash, municipio_id, perfil, ativo
      FROM usuarios WHERE email = LOWER($1)`, [email.trim()]);
    const u = r.rows[0];
    if (!u || !u.ativo || !(await bcrypt.compare(senha, u.senha_hash))) {
      res.status(401).json({ erro: 'E-mail ou senha incorretos.' }); return;
    }
    const dados = { id: u.id, municipioId: u.municipio_id, perfil: u.perfil };
    res.json({ token: criarToken(dados), usuario: { ...dados, nome: u.nome, email: u.email } });
  } catch (erro) { console.error(erro); res.status(500).json({ erro: 'Não foi possível entrar.' }); }
});
app.get('/api/auth/me', autenticar, async (req, res) => {
  try {
    const r = await pool.query(`SELECT id, nome, email, municipio_id AS "municipioId", perfil
      FROM usuarios WHERE id = $1 AND municipio_id = $2 AND ativo = TRUE`, [req.usuario!.id, req.usuario!.municipioId]);
    if (!r.rowCount) { res.status(401).json({ erro: 'Conta indisponível.' }); return; }
    res.json(r.rows[0]);
  } catch { res.status(500).json({ erro: 'Erro ao carregar perfil.' }); }
});
app.get('/api/gestor/teste', autenticar, exigirGestor, (_req, res) => {
  res.json({ mensagem: 'Acesso de gestor autorizado.' });
});
async function iniciar() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === 'SUBSTITUA_POR_UMA_CHAVE_ALEATORIA_LONGA')
    throw new Error('Defina JWT_SECRET com ao menos 32 caracteres no backend/.env');
  await pool.query('SELECT 1');
  app.listen(porta, () => console.log(`NekoUrban API: http://localhost:${porta}`));
}
iniciar().catch(erro => { console.error('Falha ao iniciar API:', erro); process.exit(1); });
