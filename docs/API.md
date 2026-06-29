# API

Base local: `/api`.

| Método | Rota | Operação |
| --- | --- | --- |
| GET | `/api/data` | Retorna todos os dados da aplicação |
| GET | `/api/dashboard` | Retorna os oito indicadores agregados por período |
| POST | `/api/vendas` | Cria uma venda |
| PUT | `/api/vendas/:id` | Atualiza uma venda |
| DELETE | `/api/vendas/:id` | Exclui uma venda |
| POST | `/api/fornecedores` | Cria um fornecedor |
| DELETE | `/api/fornecedores/:id` | Exclui um fornecedor |
| POST | `/api/contas` | Cria uma conta |
| PATCH | `/api/contas/:id/toggle` | Alterna entre Pendente e Pago |
| DELETE | `/api/contas/:id` | Exclui uma conta |

## Dashboard

Parâmetros de `/api/dashboard`:

- `period`: `today`, `yesterday`, `week`, `month`, `year` ou `custom`.
- `start`: data inicial no formato `YYYY-MM-DD`.
- `end`: data final no formato `YYYY-MM-DD`.
- `today`: data de referência para Vendas Hoje e Caixa do Dia.

Erros usam o formato:

```json
{ "error": "Descrição do erro." }
```
