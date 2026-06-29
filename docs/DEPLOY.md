# Implantação

## Ambiente local

```powershell
npm ci
npm start
```

## Vercel + Supabase

1. Execute `src/database/migrations/001_supabase_schema.sql` no SQL Editor do Supabase.
2. No painel do Supabase, abra **Connect** e copie a URL do **Transaction pooler** (porta `6543`).
3. Na Vercel, crie a variável `DATABASE_URL` para Production e Preview usando essa URL.
4. Faça o deploy. A raiz serve o frontend e `/api/*` é atendido pela função Express.

O backend acessa o PostgreSQL diretamente; nenhuma chave `service_role` ou secret key deve ser enviada ao frontend.

## Limitação da Fase 1

O deploy fica funcional, mas ainda não possui autenticação. Não divulgue a URL publicamente antes da fase de autenticação e autorização.
