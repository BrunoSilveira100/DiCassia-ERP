class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

function notFound(req, res) {
  res.status(404).json({ error: 'Rota não encontrada.' });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode = error.statusCode || error.status || 500;
  const message = statusCode >= 500 ? 'Erro interno do servidor.' : error.message;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({ error: message });
}

module.exports = { AppError, notFound, errorHandler };
