# Frontend

O frontend está em `src/frontend`:

- `index.html`: estrutura das telas e modais.
- `styles/style.css`: tema, layout e responsividade.
- `scripts/app.js`: estado da interface, API, filtros e exportações.
- `assets`: imagens e demais recursos visuais.

As chamadas usam caminhos relativos `/api`, mantendo a interface independente da porta. Para alterar o comportamento visual, preserve os IDs consumidos por `app.js`.
