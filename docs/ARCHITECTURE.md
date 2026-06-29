# Arquitetura

## Fluxo

```text
Frontend -> Routes -> Controllers -> Services -> Repositories -> SQLite
```

- **Routes:** definem método e URL.
- **Controllers:** traduzem HTTP para chamadas da aplicação.
- **Services:** validam dados e aplicam regras de negócio.
- **Repositories:** concentram SQL e persistência.
- **Config:** resolve caminhos e conexão do banco.

## Decisões

O frontend continua sem framework para manter baixo custo operacional. O backend usa CommonJS, compatível com o código atual. A camada de repositories permite trocar SQLite por PostgreSQL sem alterar controllers ou rotas.

O Express serve o diretório `src/frontend`, portanto frontend e API permanecem na mesma origem e não exigem CORS no uso local.
