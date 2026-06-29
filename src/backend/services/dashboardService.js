const dashboardRepository = require('../repositories/dashboardRepository');
const { AppError } = require('../middlewares/errors');

const allowedPeriods = new Set(['today', 'yesterday', 'week', 'month', 'year', 'custom']);

function localDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isDateValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function normalizeRange(query) {
  const now = new Date();
  const period = allowedPeriods.has(query.period) ? query.period : 'month';
  const today = isDateValue(query.today) ? query.today : localDateValue(now);
  const defaultStart = localDateValue(new Date(now.getFullYear(), now.getMonth(), 1));
  const start = query.start || defaultStart;
  const end = query.end || today;

  if (!isDateValue(start) || !isDateValue(end) || !isDateValue(today)) {
    throw new AppError('Período do dashboard inválido.', 400);
  }
  if (start > end) {
    throw new AppError('A data inicial deve ser anterior à data final.', 400);
  }

  return { period, start, end, today };
}

async function getMetrics(query) {
  const range = normalizeRange(query);
  const metrics = await dashboardRepository.getMetrics(range);

  return {
    period: range.period,
    start: range.start,
    end: range.end,
    updatedAt: new Date().toISOString(),
    metrics: {
      receitaTotal: Number(metrics.receita_total || 0),
      totalVendas: Number(metrics.total_vendas || 0),
      ticketMedio: Number(metrics.ticket_medio || 0),
      valoresReceber: Number(metrics.valores_receber || 0),
      contasPagar: Number(metrics.contas_pagar || 0),
      clientesAtendidos: Number(metrics.clientes_atendidos || 0),
      vendasHoje: Number(metrics.vendas_hoje || 0),
      caixaDia: Number(metrics.caixa_dia || 0)
    }
  };
}

module.exports = { getMetrics, normalizeRange };
