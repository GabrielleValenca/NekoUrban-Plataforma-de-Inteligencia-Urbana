import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { pool } from './config/database.js';
import { autenticar } from './auth.js';

export const ocorrenciasRouter = Router();
const pasta = path.resolve('uploads');
fs.mkdirSync(pasta, { recursive: true });
const tipos = new Map([['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp']]);
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, pasta),
    filename: (_req, file, cb) => cb(null, randomUUID() + (tipos.get(file.mimetype) ?? '.bin'))
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, tipos.has(file.mimetype))
});

// Consultas públicas exigem login e são sempre limitadas ao município do usuário.
ocorrenciasRouter.get('/', autenticar, async (req, res) => {
  const { categoriaId, status, bairro } = req.query;
  const filtros: string[] = ['o.municipio_id = $1'];
  const valores: unknown[] = [req.usuario!.municipioId];
  if (categoriaId !== undefined) {
    const id = Number(categoriaId);
    if (!Number.isInteger(id) || id < 1) { res.status(400).json({ erro: 'Categoria inválida.' }); return; }
    valores.push(id); filtros.push(`o.categoria_id = $${valores.length}`);
  }
  const permitidos = ['pendente', 'em_analise', 'em_andamento', 'resolvida', 'rejeitada'];
  if (status !== undefined) {
    if (typeof status !== 'string' || !permitidos.includes(status)) { res.status(400).json({ erro: 'Status inválido.' }); return; }
    valores.push(status); filtros.push(`o.status = $${valores.length}`);
  }
  if (bairro !== undefined) {
    if (typeof bairro !== 'string' || bairro.length > 120) { res.status(400).json({ erro: 'Bairro inválido.' }); return; }
    valores.push('%' + bairro + '%'); filtros.push(`o.bairro ILIKE $${valores.length}`);
  }
  try {
    const dados = await pool.query(`SELECT o.id, o.usuario_id AS "usuarioId", o.categoria_id AS "categoriaId",
      c.nome AS categoria, o.descricao, o.endereco, o.bairro, o.latitude, o.longitude,
      o.foto_caminho AS foto, o.status, o.criada_em AS "criadaEm"
      FROM ocorrencias o JOIN categorias c ON c.id = o.categoria_id
      WHERE ${filtros.join(' AND ')} ORDER BY o.criada_em DESC LIMIT 500`, valores);
    res.json(dados.rows);
  } catch (erro) { console.error(erro); res.status(500).json({ erro: 'Erro ao consultar ocorrências.' }); }
});

ocorrenciasRouter.post('/', autenticar, (req, res, next) => {
  upload.single('foto')(req, res, erro => {
    if (erro) { res.status(400).json({ erro: 'Foto inválida ou maior que 5 MB.' }); return; }
    next();
  });
}, async (req, res) => {
  const { categoriaId, descricao, endereco, bairro, latitude, longitude } = req.body;
  const lat = Number(latitude), lng = Number(longitude), cat = Number(categoriaId);
  const apagarFoto = () => { if (req.file) fs.unlink(req.file.path, () => {}); };
  if (!Number.isInteger(cat) || cat < 1 || typeof descricao !== 'string' || descricao.trim().length < 10 || descricao.length > 2000 ||
      !Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180 ||
      (endereco !== undefined && (typeof endereco !== 'string' || endereco.length > 300)) ||
      (bairro !== undefined && (typeof bairro !== 'string' || bairro.length > 120))) {
    apagarFoto(); res.status(400).json({ erro: 'Revise categoria, descrição (mínimo 10 caracteres) e localização.' }); return;
  }
  // Foto opcional; se enviada, o upload deve ter sido aceito.
  if (req.body.fotoEnviada === 'sim' && !req.file) {
    res.status(400).json({ erro: 'Use uma imagem JPG, PNG ou WebP de até 5 MB.' }); return;
  }
  try {
    const categoria = await pool.query('SELECT id FROM categorias WHERE id = $1', [cat]);
    if (!categoria.rowCount) { apagarFoto(); res.status(400).json({ erro: 'Categoria não encontrada.' }); return; }
    const foto = req.file ? `/uploads/${req.file.filename}` : null;
    const dados = await pool.query(`INSERT INTO ocorrencias
      (municipio_id, usuario_id, categoria_id, descricao, endereco, bairro, latitude, longitude, foto_caminho)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, status`,
      [req.usuario!.municipioId, req.usuario!.id, cat, descricao.trim(), endereco?.trim() || null,
       bairro?.trim() || null, lat, lng, foto]);
    res.status(201).json({ mensagem: 'Ocorrência registrada!', ...dados.rows[0] });
  } catch (erro) { apagarFoto(); console.error(erro); res.status(500).json({ erro: 'Erro ao salvar ocorrência.' }); }
});
