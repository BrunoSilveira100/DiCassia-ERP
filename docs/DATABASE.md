# Banco de Dados

## SQLite

Arquivo principal: `src/database/dicassia.sqlite`.

Tabelas:

- `vendas`: data, cliente, valor, pagamento, status e observação.
- `fornecedores`: nome, telefone, e-mail e produtos.
- `contas`: descrição, valor, vencimento e status.

O esquema SQLite está em `src/database/schema.sql` e é aplicado de forma idempotente na inicialização.

Os status válidos para vendas são `Pago`, `Concluído`, `Pendente`, `A Receber`, `Cancelada` e `Agendada`. A migração `002_add_sale_status` define vendas anteriores como `Pago`.

## Supabase/PostgreSQL

A migração inicial está em `src/database/migrations/001_supabase_schema.sql`. As tabelas usam tipos nativos do PostgreSQL e RLS habilitado. Políticas de acesso e autenticação devem ser definidas antes da produção.

## Backup

Pare o servidor antes de copiar manualmente o arquivo SQLite. O modo WAL pode criar arquivos auxiliares `-wal` e `-shm` enquanto a aplicação está aberta.
