const salesService = require('../services/salesService');

async function create(req, res) {
  const startedAt = Date.now();
  console.log('Recebendo venda:', {
    data: req.body?.data,
    valor: req.body?.valor,
    pagamento: req.body?.pagamento,
    status: req.body?.status
  });

  try {
    const sale = await salesService.create(req.body || {});
    console.log('Venda salva com sucesso:', { id: sale.id, durationMs: Date.now() - startedAt });
    return res.status(201).json(sale);
  } catch (error) {
    console.error('Erro ao salvar venda:', {
      message: error.message,
      code: error.code,
      durationMs: Date.now() - startedAt
    });

    const statusCode = error.statusCode || error.status || 500;
    const message = statusCode < 500
      ? error.message
      : 'Não foi possível salvar a venda. Tente novamente.';
    return res.status(statusCode).json({ error: message });
  }
}

async function update(req, res) {
  res.json(await salesService.update(req.params.id, req.body));
}

async function remove(req, res) {
  await salesService.remove(req.params.id);
  res.json({ ok: true });
}

module.exports = { create, update, remove };
