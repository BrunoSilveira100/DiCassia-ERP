# Implantação

## Ambiente local

```powershell
npm ci
npm start
```

## Produção futura

Antes de publicar na internet:

1. Migrar SQLite para PostgreSQL/Supabase.
2. Implementar autenticação e autorização.
3. Configurar RLS e revisar políticas.
4. Manter chaves secretas apenas no backend.
5. Usar HTTPS, logs rotativos e backup automatizado.

O servidor atualmente escuta `127.0.0.1` por segurança. Alterar `HOST` exige revisar autenticação e exposição da API.
