const { getDatabase } = require('../config/database');

function getMetrics(range) {
  const query = getDatabase().prepare(`
    WITH vendas_periodo AS (
      SELECT data, cliente, valor, status
      FROM vendas
      WHERE data BETWEEN ? AND ?
    )
    SELECT
      COALESCE(SUM(CASE WHEN status IN ('Pago', 'Concluído') THEN valor ELSE 0 END), 0) AS receita_total,
      COALESCE(SUM(CASE WHEN status IN ('Pago', 'Concluído', 'Pendente', 'A Receber') THEN 1 ELSE 0 END), 0) AS total_vendas,
      COALESCE(SUM(CASE WHEN status IN ('Pago', 'Concluído') THEN 1 ELSE 0 END), 0) AS vendas_pagas,
      CASE
        WHEN SUM(CASE WHEN status IN ('Pago', 'Concluído') THEN 1 ELSE 0 END) = 0 THEN 0
        ELSE SUM(CASE WHEN status IN ('Pago', 'Concluído') THEN valor ELSE 0 END) * 1.0
          / SUM(CASE WHEN status IN ('Pago', 'Concluído') THEN 1 ELSE 0 END)
      END AS ticket_medio,
      COALESCE(SUM(CASE WHEN status IN ('Pendente', 'A Receber') THEN valor ELSE 0 END), 0) AS valores_receber,
      COUNT(DISTINCT CASE
        WHEN status IN ('Pago', 'Concluído', 'Pendente', 'A Receber') THEN LOWER(TRIM(cliente))
      END) AS clientes_atendidos,
      (
        SELECT COALESCE(SUM(valor), 0)
        FROM contas
        WHERE status = 'Pendente' AND venc BETWEEN ? AND ?
      ) AS contas_pagar,
      (
        SELECT COUNT(*)
        FROM vendas
        WHERE data = ? AND status IN ('Pago', 'Concluído', 'Pendente', 'A Receber')
      ) AS vendas_hoje,
      (
        SELECT COALESCE(SUM(valor), 0)
        FROM vendas
        WHERE data = ? AND status IN ('Pago', 'Concluído')
      ) AS caixa_dia
    FROM vendas_periodo
  `);

  return query.get(range.start, range.end, range.start, range.end, range.today, range.today);
}

module.exports = { getMetrics };
