# Backend

O ponto de entrada é `src/backend/server.js`. `app.js` configura Express, JSON, rotas, arquivos estáticos e tratamento de erros.

## Camadas

- `routes`: contrato HTTP.
- `controllers`: status e respostas.
- `services`: validação e regras.
- `repositories`: consultas SQLite.
- `middlewares`: erros HTTP.
- `config`: caminhos e conexão.

Para adicionar um recurso, crie repository, service, controller e rota nessa ordem. Evite SQL fora de `repositories`.
