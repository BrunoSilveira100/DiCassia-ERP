# Visão Geral

A DiCassia é uma aplicação administrativa local para registrar vendas, fornecedores e contas a pagar. Ela também apresenta dashboard, balancete e exportação CSV.

## Escopo atual

- Cadastro, edição e exclusão de vendas.
- Cadastro e exclusão de fornecedores.
- Cadastro, pagamento e exclusão de contas.
- Indicadores mensais e relatório financeiro.
- Persistência em SQLite.

O navegador acessa uma API HTTP local. Nenhum dado de negócio é salvo no `localStorage`.
