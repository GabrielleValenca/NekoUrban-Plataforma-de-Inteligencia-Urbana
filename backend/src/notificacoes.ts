import { Router } from 'express';
import { pool } from './config/database.js';
import { autenticar } from './auth.js';

export const notificacoesRouter = Router();
notificacoesRouter.use(autenticar);

notificacoesRouter.get('/', async (req, res) => {
  try {
    const r = await pool.query(`SELECT n.id, n.ocorrencia_id AS "ocorrenciaId",
      n.mensagem, n.lida, n.criada_em AS "criadaEm"
      FROM notificacoes n JOIN ocorrencias o ON o.id=n.ocorrencia_id
      WHERE n.usuario_id=$1 AND o.municipio_id=$2
      ORDER BY n.criada_em DESC LIMIT 100`, [req.usuario!.id, req.usuario!.municipioId]);
    res.json(r.rows);
  } catch { res.status(500).json({ erro: 'Erro ao consultar notificações.' }); }
});

notificacoesRouter.patch('/:id/ler', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) { res.status(400).json({ erro: 'ID inválido.' }); return; }
  try {
    const r = await pool.query(`UPDATE notificacoes n SET lida=TRUE
      FROM ocorrencias o WHERE n.ocorrencia_id=o.id AND n.id=$1
      AND n.usuario_id=$2 AND o.municipio_id=$3 RETURNING n.id`,
      [id, req.usuario!.id, req.usuario!.municipioId]);
    if (!r.rowCount) { res.status(404).json({ erro: 'Notificação não encontrada.' }); return; }
    res.json({ mensagem: 'Notificação marcada como lida.' });
  } catch { res.status(500).json({ erro: 'Erro ao atualizar notificação.' }); }
});
