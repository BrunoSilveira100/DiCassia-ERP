const fs = require('fs');
const http = require('http');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const root = __dirname;
const host = '127.0.0.1';
const port = Number(process.env.PORT || process.argv[2] || 8000);
const db = new DatabaseSync(path.join(root, 'dicassia.sqlite'));

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS vendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    cliente TEXT NOT NULL,
    valor REAL NOT NULL,
    pagamento TEXT NOT NULL,
    obs TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fornecedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    tel TEXT DEFAULT '',
    email TEXT DEFAULT '',
    produtos TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    desc TEXT NOT NULL,
    valor REAL NOT NULL,
    venc TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Pendente',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise(function (resolve, reject) {
    var body = '';
    req.on('data', function (chunk) {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error('Payload muito grande.'));
      }
    });
    req.on('end', function () {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('JSON inválido.'));
      }
    });
    req.on('error', reject);
  });
}

function text(value) {
  return String(value == null ? '' : value).trim();
}

function money(value) {
  var parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function getAllData() {
  return {
    vendas: db.prepare('SELECT id, data, cliente, valor, pagamento, obs FROM vendas ORDER BY data DESC, id DESC').all(),
    fornecedores: db.prepare('SELECT id, nome, tel, email, produtos FROM fornecedores ORDER BY nome COLLATE NOCASE ASC, id DESC').all(),
    contas: db.prepare('SELECT id, desc, valor, venc, status FROM contas ORDER BY venc ASC, id DESC').all()
  };
}

function serveStatic(req, res) {
  var urlPath = decodeURIComponent(req.url.split('?')[0]);
  var safePath = path.normalize(urlPath).replace(/^([/\\])+/, '');
  var filePath = path.join(root, safePath || 'index.html');

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, function (statErr, stat) {
    if (statErr) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, function (readErr, data) {
      if (readErr) {
        res.writeHead(500);
        res.end('Server error');
        return;
      }

      var contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
}

async function handleApi(req, res) {
  var url = new URL(req.url, 'http://' + req.headers.host);
  var parts = url.pathname.split('/').filter(Boolean);

  if (req.method === 'GET' && url.pathname === '/api/data') {
    sendJson(res, 200, getAllData());
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/vendas') {
    var venda = await readBody(req);
    var valorVenda = money(venda.valor);
    if (!text(venda.data) || !text(venda.cliente) || !Number.isFinite(valorVenda) || valorVenda <= 0) {
      sendJson(res, 400, { error: 'Preencha data, cliente e valor.' });
      return;
    }

    var vendaResult = db.prepare('INSERT INTO vendas (data, cliente, valor, pagamento, obs) VALUES (?, ?, ?, ?, ?)')
      .run(text(venda.data), text(venda.cliente), valorVenda, text(venda.pagamento) || 'PIX', text(venda.obs));
    sendJson(res, 201, db.prepare('SELECT id, data, cliente, valor, pagamento, obs FROM vendas WHERE id = ?').get(vendaResult.lastInsertRowid));
    return;
  }

  if (req.method === 'PUT' && parts[1] === 'vendas' && parts[2]) {
    var vendaId = Number(parts[2]);
    var vendaAtualizada = await readBody(req);
    var valorAtualizado = money(vendaAtualizada.valor);
    if (!Number.isInteger(vendaId) || !text(vendaAtualizada.data) || !text(vendaAtualizada.cliente)
        || !Number.isFinite(valorAtualizado) || valorAtualizado <= 0) {
      sendJson(res, 400, { error: 'Preencha data, cliente e valor.' });
      return;
    }

    var updateResult = db.prepare('UPDATE vendas SET data = ?, cliente = ?, valor = ?, pagamento = ?, obs = ? WHERE id = ?')
      .run(text(vendaAtualizada.data), text(vendaAtualizada.cliente), valorAtualizado,
        text(vendaAtualizada.pagamento) || 'PIX', text(vendaAtualizada.obs), vendaId);
    if (!updateResult.changes) {
      sendJson(res, 404, { error: 'Venda não encontrada.' });
      return;
    }

    sendJson(res, 200, db.prepare('SELECT id, data, cliente, valor, pagamento, obs FROM vendas WHERE id = ?').get(vendaId));
    return;
  }

  if (req.method === 'DELETE' && parts[1] === 'vendas' && parts[2]) {
    db.prepare('DELETE FROM vendas WHERE id = ?').run(Number(parts[2]));
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/fornecedores') {
    var fornecedor = await readBody(req);
    if (!text(fornecedor.nome)) {
      sendJson(res, 400, { error: 'Informe o nome do fornecedor.' });
      return;
    }

    var fornecedorResult = db.prepare('INSERT INTO fornecedores (nome, tel, email, produtos) VALUES (?, ?, ?, ?)')
      .run(text(fornecedor.nome), text(fornecedor.tel), text(fornecedor.email), text(fornecedor.produtos));
    sendJson(res, 201, db.prepare('SELECT id, nome, tel, email, produtos FROM fornecedores WHERE id = ?').get(fornecedorResult.lastInsertRowid));
    return;
  }

  if (req.method === 'DELETE' && parts[1] === 'fornecedores' && parts[2]) {
    db.prepare('DELETE FROM fornecedores WHERE id = ?').run(Number(parts[2]));
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/contas') {
    var conta = await readBody(req);
    var valorConta = money(conta.valor);
    if (!text(conta.desc) || !Number.isFinite(valorConta) || valorConta <= 0) {
      sendJson(res, 400, { error: 'Preencha descrição e valor.' });
      return;
    }

    var status = text(conta.status) === 'Pago' ? 'Pago' : 'Pendente';
    var contaResult = db.prepare('INSERT INTO contas (desc, valor, venc, status) VALUES (?, ?, ?, ?)')
      .run(text(conta.desc), valorConta, text(conta.venc), status);
    sendJson(res, 201, db.prepare('SELECT id, desc, valor, venc, status FROM contas WHERE id = ?').get(contaResult.lastInsertRowid));
    return;
  }

  if (req.method === 'PATCH' && parts[1] === 'contas' && parts[2] && parts[3] === 'toggle') {
    db.prepare("UPDATE contas SET status = CASE status WHEN 'Pago' THEN 'Pendente' ELSE 'Pago' END WHERE id = ?").run(Number(parts[2]));
    sendJson(res, 200, db.prepare('SELECT id, desc, valor, venc, status FROM contas WHERE id = ?').get(Number(parts[2])));
    return;
  }

  if (req.method === 'DELETE' && parts[1] === 'contas' && parts[2]) {
    db.prepare('DELETE FROM contas WHERE id = ?').run(Number(parts[2]));
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { error: 'Rota não encontrada.' });
}

http.createServer(function (req, res) {
  if (req.url.startsWith('/api/')) {
    handleApi(req, res).catch(function (error) {
      sendJson(res, 500, { error: error.message || 'Erro interno.' });
    });
    return;
  }

  serveStatic(req, res);
}).listen(port, host, function () {
  console.log('DiCassia rodando em http://' + host + ':' + port + '/');
});
