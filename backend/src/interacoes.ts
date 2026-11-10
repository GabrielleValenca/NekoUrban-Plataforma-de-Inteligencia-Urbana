import { Router } from 'express';
import { pool } from './config/database.js';
import { autenticar, exigirGestor } from './auth.js';

export const interacoesRouter = Router();
interacoesRouter.use(autenticar);

async function existeOcorrencia(id: number, municipioId: number) {
  const r = await pool.query('SELECT id FROM ocorrencias WHERE id=$1 AND municipio_id=$2', [id, municipioId]);
  return !!r.rowCount;
}
function idValido(valor: string) {
  const n = Number(valor);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

// Comentários e apoios nunca atravessam municípios.
interacoesRouter.get('/:id/comentarios', async (req, res) => {
  const id = idValido(req.params.id as string);
  if (!id) { res.status(400).json({ erro: 'ID inválido.' }); return; }
  try {
    if (!(await existeOcorrencia(id, req.usuario!.municipioId))) { res.status(404).json({ erro: 'Ocorrência não encontrada.' }); return; }
    const r = await pool.query(`SELECT c.id, c.texto, c.criado_em AS "criadoEm", u.nome AS autor
      FROM comentarios c JOIN usuarios u ON u.id=c.usuario_id
      WHERE c.ocorrencia_id=$1 ORDER BY c.criado_em ASC LIMIT 200`, [id]);
    res.json(r.rows);
  } catch { res.status(500).json({ erro: 'Erro ao carregar comentários.' }); }
});
interacoesRouter.post('/:id/comentarios', async (req, res) => {
  const id = idValido(req.params.id as string);
  const texto = req.body?.texto;
  if (!id || typeof texto !== 'string' || texto.trim().length < 2 || texto.length > 1000) {
    res.status(400).json({ erro: 'Comentário deve ter de 2 a 1000 caracteres.' }); return;
  }
  try {
    if (!(await existeOcorrencia(id, req.usuario!.municipioId))) { res.status(404).json({ erro: 'Ocorrência não encontrada.' }); return; }
    const r = await pool.query(`INSERT INTO comentarios (ocorrencia_id, usuario_id, texto)
      VALUES ($1,$2,$3) RETURNING id`, [id, req.usuario!.id, texto.trim()]);
    res.status(201).json({ id: r.rows[0].id, mensagem: 'Comentário publicado.' });
  } catch { res.status(500).json({ erro: 'Erro ao comentar.' }); }
});
interacoesRouter.post('/:id/apoio', async (req, res) => {
  const id = idValido(req.params.id as string);
  if (!id) { res.status(400).json({ erro: 'ID inválido.' }); return; }
  try {
    if (!(await existeOcorrencia(id, req.usuario!.municipioId))) { res.status(404).json({ erro: 'Ocorrência não encontrada.' }); return; }
    await pool.query(`INSERT INTO apoios (ocorrencia_id, usuario_id) VALUES ($1,$2)
      ON CONFLICT (ocorrencia_id, usuario_id) DO NOTHING`, [id, req.usuario!.id]);
    res.json({ mensagem: 'Apoio registrado.' });
  } catch { res.status(500).json({ erro: 'Erro ao apoiar.' }); }
});
interacoesRouter.delete('/:id/apoio', async (req, res) => {
  const id = idValido(req.params.id as string);
  if (!id) { res.status(400).json({ erro: 'ID inválido.' }); return; }
  try {
    if (!(await existeOcorrencia(id, req.usuario!.municipioId))) { res.status(404).json({ erro: 'Ocorrência não encontrada.' }); return; }
    await pool.query('DELETE FROM apoios WHERE ocorrencia_id=$1 AND usuario_id=$2', [id, req.usuario!.id]);
    res.json({ mensagem: 'Apoio removido.' });
  } catch { res.status(500).json({ erro: 'Erro ao remover apoio.' }); }
});

// Rota administrativa simples para testar as notificações. Painel completo na etapa 5.
interacoesRouter.patch('/:id/status', exigirGestor, async (req, res) => {
  const id = idValido(req.params.id as string);
  const status = req.body?.status;
  const permitidos = ['pendente','em_analise','em_andamento','resolvida','rejeitada'];
  if (!id || !permitidos.includes(status)) { res.status(400).json({ erro: 'ID ou status inválido.' }); return; }
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const atual = await cliente.query(`SELECT id, usuario_id, status FROM ocorrencias
      WHERE id=$1 AND municipio_id=$2 FOR UPDATE`, [id, req.usuario!.municipioId]);
    if (!atual.rowCount) { await cliente.query('ROLLBACK'); res.status(404).json({ erro: 'Ocorrência não encontrada.' }); return; }
    const anterior = atual.rows[0].status;
    if (anterior === status) { await cliente.query('COMMIT'); res.json({ mensagem: 'Status já estava atualizado.' }); return; }
    await cliente.query(`UPDATE ocorrencias SET status=$1, atualizada_em=NOW() WHERE id=$2`, [status,id]);
    await cliente.query(`INSERT INTO historico_status (ocorrencia_id, gestor_id, status_anterior, status_novo)
      VALUES ($1,$2,$3,$4)`, [id, req.usuario!.id, anterior, status]);
    await cliente.query(`INSERT INTO notificacoes (usuario_id, ocorrencia_id, mensagem)
      VALUES ($1,$2,$3)`, [atual.rows[0].usuario_id, id, `A ocorrência #${id} mudou para ${status.replaceAll('_',' ')}.`]);
    await cliente.query('COMMIT');
    res.json({ mensagem: 'Status atualizado e notificação criada.' });
  } catch (erro) {
    await cliente.query('ROLLBACK'); console.error(erro);
    res.status(500).json({ erro: 'Erro ao atualizar status.' });
  } finally { cliente.release(); }
});
