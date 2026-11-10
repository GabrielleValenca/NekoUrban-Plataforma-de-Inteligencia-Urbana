import { Router } from 'express';
import { pool } from './config/database.js';
import { autenticar, exigirGestor } from './auth.js';

export const gestorRouter = Router();
gestorRouter.use(autenticar, exigirGestor);

function filtros(req: any) {
  const categoriaId = req.query.categoriaId ? Number(req.query.categoriaId) : null;
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const bairro = typeof req.query.bairro === 'string' ? req.query.bairro.trim() : '';
  const inicio = typeof req.query.inicio === 'string' ? req.query.inicio : '';
  const fim = typeof req.query.fim === 'string' ? req.query.fim : '';
  if (categoriaId !== null && (!Number.isSafeInteger(categoriaId) || categoriaId <= 0)) throw new Error('Categoria inválida');
  if (status && !['pendente','em_analise','em_andamento','resolvida','rejeitada'].includes(status)) throw new Error('Status inválido');
  if (bairro.length > 120 || (inicio && !/^\d{4}-\d{2}-\d{2}$/.test(inicio)) || (fim && !/^\d{4}-\d{2}-\d{2}$/.test(fim))) throw new Error('Filtro inválido');
  return {
    where: `o.municipio_id=$1
      AND ($2::integer IS NULL OR o.categoria_id=$2)
      AND ($3::text = '' OR o.status=$3)
      AND ($4::text = '' OR o.bairro ILIKE '%' || $4 || '%')
      AND ($5::text = '' OR o.criada_em >= $5::date)
      AND ($6::text = '' OR o.criada_em < $6::date + INTERVAL '1 day')`,
    params: [req.usuario.municipioId, categoriaId, status, bairro, inicio, fim]
  };
}
gestorRouter.get('/indicadores', async (req, res) => {
  try {
    const { where, params } = filtros(req);
    const [resumo, categorias, bairros, evolucao, pontos] = await Promise.all([
      pool.query(`SELECT COUNT(*)::integer AS total,
        COUNT(*) FILTER (WHERE o.status='pendente')::integer AS pendentes,
        COUNT(*) FILTER (WHERE o.status='em_andamento')::integer AS "emAndamento",
        COUNT(*) FILTER (WHERE o.status='resolvida')::integer AS resolvidas
        FROM ocorrencias o WHERE ${where}`, params),
      pool.query(`SELECT c.nome, COUNT(*)::integer AS total FROM ocorrencias o
        JOIN categorias c ON c.id=o.categoria_id WHERE ${where}
        GROUP BY c.id, c.nome ORDER BY total DESC`, params),
      pool.query(`SELECT COALESCE(NULLIF(TRIM(o.bairro),''),'Não informado') AS nome,
        COUNT(*)::integer AS total FROM ocorrencias o WHERE ${where}
        GROUP BY 1 ORDER BY total DESC LIMIT 12`, params),
      pool.query(`SELECT TO_CHAR(DATE_TRUNC('month',o.criada_em),'YYYY-MM') AS mes,
        COUNT(*)::integer AS total FROM ocorrencias o WHERE ${where}
        GROUP BY 1 ORDER BY 1`, params),
      pool.query(`SELECT o.latitude, o.longitude, o.id, o.status FROM ocorrencias o
        WHERE ${where} ORDER BY o.criada_em DESC LIMIT 2000`, params)
    ]);
    res.json({ resumo: resumo.rows[0], categorias: categorias.rows,
      bairros: bairros.rows, evolucao: evolucao.rows, pontos: pontos.rows });
  } catch (erro) {
    res.status(400).json({ erro: erro instanceof Error ? erro.message : 'Erro nos indicadores.' });
  }
});

gestorRouter.get('/historico', async (req, res) => {
  try {
    const { where, params } = filtros(req);
    const r = await pool.query(`SELECT h.id, h.ocorrencia_id AS "ocorrenciaId",
      h.status_anterior AS "anterior", h.status_novo AS "novo",
      h.alterado_em AS "alteradoEm", u.nome AS gestor
      FROM historico_status h JOIN ocorrencias o ON o.id=h.ocorrencia_id
      JOIN usuarios u ON u.id=h.gestor_id
      WHERE ${where} ORDER BY h.alterado_em DESC LIMIT 200`, params);
    res.json(r.rows);
  } catch (erro) { res.status(400).json({ erro: erro instanceof Error ? erro.message : 'Erro no histórico.' }); }
});

gestorRouter.get('/relatorio.csv', async (req, res) => {
  try {
    const { where, params } = filtros(req);
    const r = await pool.query(`SELECT o.id, c.nome AS categoria, o.status, o.bairro,
      o.endereco, o.descricao, o.criada_em AS data, o.latitude, o.longitude
      FROM ocorrencias o JOIN categorias c ON c.id=o.categoria_id
      WHERE ${where} ORDER BY o.criada_em DESC LIMIT 10000`, params);
    const campos = ['id','categoria','status','bairro','endereco','descricao','data','latitude','longitude'];
    const celula = (v: unknown) => {
      const texto = String(v ?? '');
      const alvo = texto.trim();
      // Impede execução de fórmulas ao abrir o CSV no Excel.
      // Valores puramente numéricos (latitude/longitude, por exemplo) não são
      // escapados, senão o Excel os trataria como texto e quebraria gráficos e
      // mapas. Qualquer texto não numérico que comece por = + @ - ou controle
      // continua sendo neutralizado com o apóstrofo.
      const numerico = alvo !== '' && Number.isFinite(Number(alvo));
      const seguro = !numerico && /^[\s]*[=+@\-\t\r]/.test(texto) ? "'" + texto : texto;
      return '"' + seguro.replaceAll('"','""') + '"';
    };
    const linhas = [campos.join(';'), ...r.rows.map(row => campos.map(c => celula(row[c])).join(';'))];
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition','attachment; filename="nekourban-relatorio.csv"');
    res.send('\uFEFF' + linhas.join('\r\n'));
  } catch (erro) { res.status(400).json({ erro: erro instanceof Error ? erro.message : 'Erro no relatório.' }); }
});
