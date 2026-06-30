// =====================
// DiCassia — app.js
// =====================

var vendas = [];
var fornecedores = [];
var contas = [];
var vendaEmEdicaoId = null;
var dashboardData = null;
var dashboardPeriod = 'month';

var themeToggle = document.getElementById('theme-toggle');
var sidebar = document.getElementById('sidebar');
var menuToggle = document.getElementById('menu-toggle');
var sidebarClose = document.getElementById('sidebar-close');
var sidebarOverlay = document.getElementById('sidebar-overlay');
var pageContext = document.getElementById('page-context');
var backButton = document.getElementById('back-button');
var currentPageTitle = document.getElementById('current-page-title');
var desktopSidebarQuery = window.matchMedia('(min-width: 1024px)');
var navigationIndex = 0;
var pageTitles = {
  dashboard: 'Dashboard',
  'nova-venda': 'Nova Venda',
  vendas: 'Histórico',
  fornecedores: 'Fornecedores',
  contas: 'Contas a Pagar',
  balancete: 'Fluxo de Caixa',
  relatorios: 'Relatórios',
  config: 'Configurações'
};

function setSidebarOpen(open) {
  var shouldOpen = !desktopSidebarQuery.matches && open;
  document.body.classList.toggle('sidebar-open', shouldOpen);
  if (menuToggle) menuToggle.setAttribute('aria-expanded', String(shouldOpen));
  if (sidebar) sidebar.setAttribute('aria-hidden', String(!desktopSidebarQuery.matches && !shouldOpen));
  if (sidebarOverlay) sidebarOverlay.setAttribute('aria-hidden', String(!shouldOpen));
}

function closeSidebar() {
  setSidebarOpen(false);
}

if (menuToggle) {
  menuToggle.addEventListener('click', function () {
    setSidebarOpen(!document.body.classList.contains('sidebar-open'));
  });
}
if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
desktopSidebarQuery.addEventListener('change', closeSidebar);
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') closeSidebar();
});
setSidebarOpen(false);

function updateThemeButton() {
  if (!themeToggle) return;
  var isDark = document.documentElement.dataset.theme === 'dark';
  themeToggle.querySelector('i').className = 'ti ' + (isDark ? 'ti-sun' : 'ti-moon');
  themeToggle.setAttribute('aria-label', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
  themeToggle.title = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';
}

if (themeToggle) {
  updateThemeButton();
  themeToggle.addEventListener('click', function () {
    var nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('dicassia-theme', nextTheme);
    updateThemeButton();
  });
}

var today = dateInputValue(new Date());
document.getElementById('v-data').value = today;

var mesAtual = new Date().getMonth();
var anoAtual = new Date().getFullYear();
document.getElementById('b-mes').value = mesAtual;

var bAno = document.getElementById('b-ano');
for (var y = anoAtual; y >= anoAtual - 5; y--) {
  var opt = document.createElement('option');
  opt.value = y;
  opt.textContent = y;
  bAno.appendChild(opt);
}

// Remove dados antigos do navegador. A partir daqui, a fonte é o banco SQLite.
localStorage.removeItem('dc_vendas');
localStorage.removeItem('dc_forn');
localStorage.removeItem('dc_contas');

// ---- API ----
async function api(path, options) {
  var controller = new AbortController();
  var timeoutId = setTimeout(function () { controller.abort(); }, 8000);
  var requestOptions = Object.assign({
    headers: { 'Content-Type': 'application/json' }
  }, options || {}, { signal: controller.signal });

  var res;
  try {
    res = await fetch(path, requestOptions);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('O servidor demorou para responder. Tente novamente.');
    }
    throw new Error('Não foi possível conectar ao servidor.');
  } finally {
    clearTimeout(timeoutId);
  }

  var data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    throw new Error(data.error || 'Não foi possível conectar ao servidor.');
  }

  return data;
}

async function carregarDados() {
  var range = getDashboardRange();
  var results = await Promise.all([
    api('/api/data'),
    api('/api/dashboard?' + dashboardQuery(range))
  ]);
  var data = results[0];
  vendas = data.vendas || [];
  fornecedores = data.fornecedores || [];
  contas = data.contas || [];
  dashboardData = results[1];

  renderDashboard();
  renderPaginaAtual();
}

function renderPaginaAtual() {
  var active = document.querySelector('.nav-item.active[data-page]');
  var pg = active ? active.dataset.page : 'dashboard';

  if (pg === 'dashboard')    renderDashboard();
  if (pg === 'vendas')       renderVendas();
  if (pg === 'fornecedores') renderFornecedores();
  if (pg === 'contas')       renderContas();
  if (pg === 'balancete')    renderBalancete();
}

// ---- NAVEGAÇÃO ----
function setCurrentPageTitle(title) {
  if (currentPageTitle) currentPageTitle.textContent = title;
}

function navigateToPage(page, options) {
  var settings = options || {};
  var targetPage = document.getElementById('page-' + page);
  if (!targetPage) {
    page = 'dashboard';
    targetPage = document.getElementById('page-dashboard');
  }

  var previous = document.querySelector('.nav-item.active[data-page]');
  var previousPage = previous ? previous.dataset.page : null;

  document.querySelectorAll('.nav-item').forEach(function (item) { item.classList.remove('active'); });
  var navItem = document.querySelector('.nav-item[data-page="' + page + '"]');
  if (navItem) navItem.classList.add('active');

  document.querySelectorAll('.page').forEach(function (item) { item.classList.remove('active'); });
  targetPage.classList.add('active');

  var showBack = page !== 'dashboard';
  document.body.classList.toggle('has-page-back', showBack);
  if (pageContext) pageContext.hidden = !showBack;
  setCurrentPageTitle(pageTitles[page] || 'DiCassia');

  if (settings.history !== false && previousPage !== page) {
    navigationIndex += 1;
    window.history.pushState(
      { dicassiaPage: page, dicassiaIndex: navigationIndex },
      '',
      page === 'dashboard' ? window.location.pathname + window.location.search : '#' + page
    );
  }

  renderPaginaAtual();
  closeSidebar();
}

document.querySelectorAll('.nav-item[data-page]').forEach(function (el) {
  el.addEventListener('click', function () {
    navigateToPage(this.dataset.page);
  });
});

document.querySelectorAll('[data-go-to]').forEach(function (el) {
  el.addEventListener('click', function () {
    navigateToPage(this.dataset.goTo);
  });
});

if (backButton) {
  backButton.addEventListener('click', function () {
    this.classList.remove('clicked');
    void this.offsetWidth;
    this.classList.add('clicked');
    if (navigationIndex > 0) {
      window.history.back();
    } else {
      navigateToPage('dashboard', { history: false });
      window.history.replaceState({ dicassiaPage: 'dashboard', dicassiaIndex: 0 }, '', window.location.pathname + window.location.search);
    }
  });
}

window.addEventListener('popstate', function (event) {
  var state = event.state || {};
  navigationIndex = Number(state.dicassiaIndex || 0);
  navigateToPage(state.dicassiaPage || 'dashboard', { history: false });
});

var initialPage = window.location.hash.slice(1);
if (!document.getElementById('page-' + initialPage)) initialPage = 'dashboard';
window.history.replaceState({ dicassiaPage: initialPage, dicassiaIndex: 0 }, '', window.location.href);
navigateToPage(initialPage, { history: false });

document.querySelectorAll('[data-coming-soon]').forEach(function (el) {
  el.addEventListener('click', function () {
    showToast(this.dataset.comingSoon + ': módulo em breve.');
    closeSidebar();
  });
});

var logoutItem = document.querySelector('.logout-item');
if (logoutItem) {
  logoutItem.addEventListener('click', function () {
    showToast('Saída disponível após a implementação da autenticação.');
    closeSidebar();
  });
}

var newSaleButton = document.querySelector('.new-sale-btn');
if (newSaleButton) {
  newSaleButton.addEventListener('click', function () {
    this.classList.remove('clicked');
    void this.offsetWidth;
    this.classList.add('clicked');
    setTimeout(function () { newSaleButton.classList.remove('clicked'); }, 160);
  });
}

// ---- UTILITÁRIOS ----
function fmt(v) {
  return 'R$ ' + parseFloat(v || 0).toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function dateInputValue(date) {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, '0');
  var day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function dateParts(value) {
  var parts = String(value || '').split('-').map(function (p) { return parseInt(p, 10); });
  return { year: parts[0], month: parts[1] - 1, day: parts[2] };
}

function isSameMonth(value, month, year) {
  var parts = dateParts(value);
  return parts.month === month && parts.year === year;
}

function showToast(msg) {
  var t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 3000);
}

function badgePag(p) {
  var cls = {
    'PIX': 'badge-pix',
    'Dinheiro': 'badge-dinheiro',
    'Cartão de Crédito': 'badge-credito',
    'Cartão de Débito': 'badge-debito'
  };
  return '<span class="badge ' + (cls[p] || '') + '">' + esc(p) + '</span>';
}

function badgeVendaStatus(status) {
  var cls = {
    'Pago': 'badge-pago',
    'Concluído': 'badge-pago',
    'Pendente': 'badge-pendente',
    'A Receber': 'badge-pendente',
    'Cancelada': 'badge-cancelada',
    'Agendada': 'badge-agendada'
  };
  return '<span class="badge ' + (cls[status] || '') + '">' + esc(status) + '</span>';
}

// ---- NOVA VENDA ----
async function salvarVenda() {
  var data      = document.getElementById('v-data').value;
  var cliente   = document.getElementById('v-cliente').value.trim();
  var valor     = parseFloat(document.getElementById('v-valor').value);
  var pagamento = document.getElementById('v-pagamento').value;
  var status    = document.getElementById('v-status').value;
  var obs       = document.getElementById('v-obs').value.trim();

  if (!data || !cliente || isNaN(valor) || valor <= 0) {
    showToast('Preencha data, cliente e valor!');
    return;
  }

  var saveButton = document.getElementById('v-salvar');
  var editando = vendaEmEdicaoId !== null;
  saveButton.disabled = true;
  saveButton.innerHTML = '<i class="ti ti-loader-2"></i> SALVANDO...';

  try {
    await api(editando ? '/api/vendas/' + vendaEmEdicaoId : '/api/vendas', {
      method: editando ? 'PUT' : 'POST',
      body: JSON.stringify({ data, cliente, valor, pagamento, status, obs })
    });

    limparFormularioVenda();
    showToast(editando ? 'Venda atualizada com sucesso!' : 'Venda salva com sucesso!');

    try {
      await carregarDados();
    } catch (refreshError) {
      console.error('Venda salva, mas a atualização dos dados falhou:', refreshError);
    }
  } catch (e) {
    showToast(e.message);
  } finally {
    saveButton.disabled = false;
    saveButton.innerHTML = vendaEmEdicaoId === null
      ? '<i class="ti ti-device-floppy"></i> SALVAR VENDA'
      : '<i class="ti ti-device-floppy"></i> SALVAR ALTERAÇÕES';
  }
}

function limparFormularioVenda() {
  vendaEmEdicaoId = null;
  document.getElementById('v-cliente').value = '';
  document.getElementById('v-valor').value = '';
  document.getElementById('v-pagamento').value = 'PIX';
  document.getElementById('v-status').value = 'Pago';
  document.getElementById('v-obs').value = '';
  document.getElementById('v-data').value = today;
  document.getElementById('v-form-title').textContent = 'NOVA VENDA';
  if (document.getElementById('page-nova-venda').classList.contains('active')) {
    setCurrentPageTitle('Nova Venda');
  }
  document.getElementById('v-salvar').innerHTML = '<i class="ti ti-device-floppy"></i> SALVAR VENDA';
  document.getElementById('v-cancelar').classList.remove('show');
}

function editarVenda(id) {
  var venda = vendas.find(function (item) { return Number(item.id) === Number(id); });
  if (!venda) {
    showToast('Venda não encontrada.');
    return;
  }

  vendaEmEdicaoId = Number(venda.id);
  document.getElementById('v-data').value = venda.data;
  document.getElementById('v-cliente').value = venda.cliente;
  document.getElementById('v-valor').value = venda.valor;
  document.getElementById('v-pagamento').value = venda.pagamento;
  document.getElementById('v-status').value = venda.status || 'Pago';
  document.getElementById('v-obs').value = venda.obs || '';
  document.getElementById('v-form-title').textContent = 'EDITAR VENDA';
  document.getElementById('v-salvar').innerHTML = '<i class="ti ti-device-floppy"></i> SALVAR ALTERAÇÕES';
  document.getElementById('v-cancelar').classList.add('show');
  document.querySelector('.new-sale-btn').click();
  setCurrentPageTitle('Editar Venda');
  document.getElementById('v-cliente').focus();
}

function cancelarEdicaoVenda() {
  limparFormularioVenda();
}

// ---- DASHBOARD ----
function addDays(date, amount) {
  var result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function getDashboardRange() {
  var now = new Date();
  var todayValue = dateInputValue(now);
  var start = todayValue;
  var end = todayValue;

  if (dashboardPeriod === 'yesterday') {
    start = end = dateInputValue(addDays(now, -1));
  } else if (dashboardPeriod === 'week') {
    var day = now.getDay();
    start = dateInputValue(addDays(now, day === 0 ? -6 : 1 - day));
  } else if (dashboardPeriod === 'month') {
    start = dateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
  } else if (dashboardPeriod === 'year') {
    start = dateInputValue(new Date(now.getFullYear(), 0, 1));
  } else if (dashboardPeriod === 'custom') {
    start = document.getElementById('dashboard-start').value;
    end = document.getElementById('dashboard-end').value;
  }

  return { period: dashboardPeriod, start: start, end: end, today: todayValue };
}

function dashboardQuery(range) {
  return new URLSearchParams(range).toString();
}

function formatShortDate(value) {
  if (!value) return '';
  return value.split('-').reverse().join('/');
}

async function carregarDashboard() {
  var range = getDashboardRange();
  if (!range.start || !range.end) {
    showToast('Informe as duas datas do período.');
    return;
  }

  try {
    dashboardData = await api('/api/dashboard?' + dashboardQuery(range));
    renderDashboard();
  } catch (error) {
    showToast(error.message);
  }
}

function renderDashboard() {
  var container = document.getElementById('dash-metrics');
  if (!dashboardData || !dashboardData.metrics) {
    container.innerHTML = '<div class="dashboard-loading">Carregando indicadores...</div>';
    return;
  }

  var m = dashboardData.metrics;
  var metricas = [
    { label: 'Receita Total', target: m.receitaTotal, type: 'money', sub: 'vendas pagas no período', badge: '+18% vs mês ant.', tone: 'positive', icon: 'ti-currency-dollar' },
    { label: 'Total de Vendas', target: m.totalVendas, type: 'count', singular: ' venda', plural: ' vendas', sub: 'vendas realizadas', badge: '+2 vs mês ant.', tone: 'positive', icon: 'ti-shopping-bag' },
    { label: 'Ticket Médio', target: m.ticketMedio, type: 'money', sub: 'por venda paga', badge: '-5% vs mês ant.', tone: 'negative', icon: 'ti-target' },
    { label: 'Valores a Receber', target: m.valoresReceber, type: 'money', sub: 'vendas pendentes', badge: 'sem pendências', tone: 'neutral', icon: 'ti-hourglass', cardClass: 'is-muted' },
    { label: 'Contas a Pagar', target: m.contasPagar, type: 'money', sub: 'contas pendentes no período', icon: 'ti-credit-card', cardClass: 'is-expense' },
    { label: 'Clientes Atendidos', target: m.clientesAtendidos, type: 'count', singular: ' cliente', plural: ' clientes', sub: 'clientes únicos', badge: 'recorrentes: 2', tone: 'positive', icon: 'ti-users' },
    { label: 'Vendas Hoje', target: m.vendasHoje, type: 'count', singular: ' venda', plural: ' vendas', sub: 'na data atual', icon: 'ti-calendar-stats' },
    { label: 'Caixa do Dia', target: m.caixaDia, type: 'money', sub: 'recebido hoje', badge: 'meta: R$ 50', tone: 'positive', icon: 'ti-wallet' }
  ];

  container.innerHTML = metricas.map(function (item) {
    var badge = item.badge ? '<span class="metric-badge ' + item.tone + '">' + esc(item.badge) + '</span>' : '';
    return '<article class="metric-card ' + (item.cardClass || '') + '">'
      + '<div class="metric-top"><span class="metric-icon"><i class="ti ' + item.icon + '"></i></span></div>'
      + '<div class="label">' + esc(item.label) + '</div>'
      + '<div class="value animated-value" data-target="' + Number(item.target || 0) + '" data-type="' + item.type + '" data-singular="' + esc(item.singular || '') + '" data-plural="' + esc(item.plural || '') + '">0</div>'
      + '<div class="metric-footer"><div class="sub">' + esc(item.sub) + '</div>' + badge + '</div>'
      + '</article>';
  }).join('');

  document.getElementById('dashboard-period-label').textContent =
    formatShortDate(dashboardData.start) + ' a ' + formatShortDate(dashboardData.end);

  animateDashboardCounters();
  renderDashboardMovements();
}

function renderDashboardMovements() {
  var container = document.getElementById('dashboard-movements');
  if (!container) return;

  var recentes = vendas.slice().sort(function (a, b) {
    var dateCompare = String(b.data || '').localeCompare(String(a.data || ''));
    return dateCompare || Number(b.id || 0) - Number(a.id || 0);
  }).slice(0, 4);

  if (!recentes.length) {
    container.innerHTML = '<div class="movement-empty"><i class="ti ti-shopping-cart-off"></i><span>Nenhuma venda lançada ainda.</span></div>';
    return;
  }

  container.innerHTML = recentes.map(function (venda) {
    var titulo = venda.obs || 'Venda para ' + (venda.cliente || 'Cliente');
    var detalhes = formatShortDate(venda.data) + ' · ' + (venda.cliente || 'Cliente') + ' · ' + (venda.pagamento || 'Não informado');
    return '<div class="movement-item">'
      + '<span class="movement-icon"><i class="ti ti-shopping-bag"></i></span>'
      + '<div><strong>' + esc(titulo) + '</strong><small>' + esc(detalhes) + '</small></div>'
      + '<b>+' + esc(fmt(venda.valor)) + '</b>'
      + '</div>';
  }).join('');
}

function animateDashboardCounters() {
  document.querySelectorAll('.animated-value').forEach(function (element) {
    var target = Number(element.dataset.target || 0);
    var isMoney = element.dataset.type === 'money';
    var duration = isMoney ? 600 : 400;
    var frames = Math.max(1, Math.round(duration / 16));
    var frame = 0;
    var timer = setInterval(function () {
      frame += 1;
      var current = target * Math.min(frame / frames, 1);
      if (isMoney) {
        element.textContent = fmt(current);
      } else {
        var count = Math.round(current);
        element.textContent = count + (count === 1 ? element.dataset.singular : element.dataset.plural);
      }
      if (frame >= frames) clearInterval(timer);
    }, 16);
  });
}

function selecionarPeriodoDashboard(period) {
  dashboardPeriod = period;
  document.querySelectorAll('#dashboard-period-tabs button').forEach(function (button) {
    button.classList.toggle('active', button.dataset.period === period);
  });

  var custom = document.getElementById('dashboard-custom-period');
  custom.hidden = period !== 'custom';
  if (period !== 'custom') carregarDashboard();
}

document.querySelectorAll('#dashboard-period-tabs button').forEach(function (button) {
  button.addEventListener('click', function () {
    selecionarPeriodoDashboard(this.dataset.period);
  });
});

document.getElementById('dashboard-apply').addEventListener('click', carregarDashboard);

// ---- VENDAS ----
function renderVendas() {
  var fd = document.getElementById('f-data').value;
  var fp = document.getElementById('f-pag').value;
  var fs = document.getElementById('f-venda-status').value;
  var fc = document.getElementById('f-cli').value.toLowerCase();

  var filtradas = vendas.filter(function (v) {
    return (!fd || v.data === fd)
        && (!fp || v.pagamento === fp)
        && (!fs || v.status === fs)
        && (!fc || String(v.cliente || '').toLowerCase().includes(fc));
  });

  var tb = document.getElementById('tbody-vendas');

  if (!filtradas.length) {
    tb.innerHTML = '<tr><td colspan="7" class="empty"><i class="ti ti-shopping-bag"></i>Nenhuma venda encontrada</td></tr>';
    return;
  }

  tb.innerHTML = filtradas.map(function (v) {
    var dataFmt = v.data.split('-').reverse().join('/');
    return '<tr>'
      + '<td>' + esc(dataFmt) + '</td>'
      + '<td style="font-weight:500">' + esc(v.cliente) + '</td>'
      + '<td style="color:var(--pink);font-weight:600">' + fmt(v.valor) + '</td>'
      + '<td>' + badgePag(v.pagamento) + '</td>'
      + '<td>' + badgeVendaStatus(v.status || 'Pago') + '</td>'
      + '<td style="color:#aaa;font-size:12px">' + esc(v.obs || '—') + '</td>'
      + '<td><div class="table-actions">'
      + '<button class="icon-btn" onclick="editarVenda(' + v.id + ')" title="Editar venda" aria-label="Editar venda"><i class="ti ti-pencil"></i></button>'
      + '<button class="icon-btn" onclick="delVenda(' + v.id + ')" title="Excluir venda" aria-label="Excluir venda"><i class="ti ti-trash"></i></button>'
      + '</div></td>'
      + '</tr>';
  }).join('');
}

async function delVenda(id) {
  if (!confirm('Excluir esta venda?')) return;

  try {
    await api('/api/vendas/' + id, { method: 'DELETE' });
    await carregarDados();
    showToast('Venda excluída.');
  } catch (e) {
    showToast(e.message);
  }
}

// ---- FORNECEDORES ----
function renderFornecedores() {
  var tb = document.getElementById('tbody-forn');

  if (!fornecedores.length) {
    tb.innerHTML = '<tr><td colspan="5" class="empty"><i class="ti ti-truck"></i>Nenhum fornecedor cadastrado</td></tr>';
    return;
  }

  tb.innerHTML = fornecedores.map(function (f) {
    return '<tr>'
      + '<td style="font-weight:500">' + esc(f.nome) + '</td>'
      + '<td>' + esc(f.tel) + '</td>'
      + '<td>' + esc(f.email) + '</td>'
      + '<td>' + esc(f.produtos) + '</td>'
      + '<td><button class="icon-btn" onclick="delForn(' + f.id + ')"><i class="ti ti-trash"></i></button></td>'
      + '</tr>';
  }).join('');
}

async function salvarFornecedor() {
  var nome  = document.getElementById('fn-nome').value.trim();
  var tel   = document.getElementById('fn-tel').value.trim();
  var email = document.getElementById('fn-email').value.trim();
  var prod  = document.getElementById('fn-prod').value.trim();

  if (!nome) {
    showToast('Informe o nome do fornecedor!');
    return;
  }

  try {
    await api('/api/fornecedores', {
      method: 'POST',
      body: JSON.stringify({ nome, tel, email, produtos: prod })
    });
    closeModal('modal-forn');

    document.getElementById('fn-nome').value  = '';
    document.getElementById('fn-tel').value   = '';
    document.getElementById('fn-email').value = '';
    document.getElementById('fn-prod').value  = '';

    await carregarDados();
    showToast('Fornecedor salvo!');
  } catch (e) {
    showToast(e.message);
  }
}

async function delForn(id) {
  if (!confirm('Excluir este fornecedor?')) return;

  try {
    await api('/api/fornecedores/' + id, { method: 'DELETE' });
    await carregarDados();
  } catch (e) {
    showToast(e.message);
  }
}

// ---- CONTAS A PAGAR ----
function renderContas() {
  var fs = document.getElementById('f-status').value;
  var filtradas = contas.filter(function (c) { return !fs || c.status === fs; });

  var tb = document.getElementById('tbody-contas');

  if (!filtradas.length) {
    tb.innerHTML = '<tr><td colspan="5" class="empty"><i class="ti ti-credit-card"></i>Nenhuma conta encontrada</td></tr>';
    return;
  }

  tb.innerHTML = filtradas.map(function (c) {
    var venc  = c.venc ? c.venc.split('-').reverse().join('/') : '—';
    var badge = '<span class="badge badge-' + (c.status === 'Pago' ? 'pago' : 'pendente') + '">' + esc(c.status) + '</span>';
    return '<tr>'
      + '<td style="font-weight:500">' + esc(c.desc) + '</td>'
      + '<td style="color:var(--pink);font-weight:600">' + fmt(c.valor) + '</td>'
      + '<td>' + esc(venc) + '</td>'
      + '<td>' + badge + '</td>'
      + '<td>'
      + '<button class="icon-btn" onclick="toggleConta(' + c.id + ')" title="Alternar status"><i class="ti ti-check"></i></button>'
      + '<button class="icon-btn" onclick="delConta(' + c.id + ')"><i class="ti ti-trash"></i></button>'
      + '</td>'
      + '</tr>';
  }).join('');
}

async function salvarConta() {
  var desc   = document.getElementById('ct-desc').value.trim();
  var val    = parseFloat(document.getElementById('ct-val').value);
  var venc   = document.getElementById('ct-venc').value;
  var status = document.getElementById('ct-status').value;

  if (!desc || isNaN(val) || val <= 0) {
    showToast('Preencha descrição e valor!');
    return;
  }

  try {
    await api('/api/contas', {
      method: 'POST',
      body: JSON.stringify({ desc, valor: val, venc, status })
    });
    closeModal('modal-conta');

    document.getElementById('ct-desc').value = '';
    document.getElementById('ct-val').value  = '';
    document.getElementById('ct-venc').value = '';

    await carregarDados();
    showToast('Conta salva!');
  } catch (e) {
    showToast(e.message);
  }
}

async function toggleConta(id) {
  try {
    await api('/api/contas/' + id + '/toggle', { method: 'PATCH' });
    await carregarDados();
  } catch (e) {
    showToast(e.message);
  }
}

async function delConta(id) {
  if (!confirm('Excluir esta conta?')) return;

  try {
    await api('/api/contas/' + id, { method: 'DELETE' });
    await carregarDados();
  } catch (e) {
    showToast(e.message);
  }
}

// ---- BALANCETE ----
function renderBalancete() {
  var mes = parseInt(document.getElementById('b-mes').value);
  var ano = parseInt(document.getElementById('b-ano').value || anoAtual);

  var mv = vendas.filter(function (v) {
    return isSameMonth(v.data, mes, ano)
      && ['Pago', 'Concluído'].includes(v.status || 'Pago');
  });

  var mc = contas.filter(function (c) {
    if (!c.venc || c.status !== 'Pago') return false;
    return isSameMonth(c.venc, mes, ano);
  });

  var entradas = mv.reduce(function (a, v) { return a + Number(v.valor || 0); }, 0);
  var saidas   = mc.reduce(function (a, c) { return a + Number(c.valor || 0); }, 0);
  var saldo    = entradas - saidas;

  document.getElementById('b-entradas').textContent = fmt(entradas);
  document.getElementById('b-saidas').textContent   = fmt(saidas);

  var selSaldo = document.getElementById('b-saldo');
  selSaldo.textContent = fmt(saldo);
  selSaldo.style.color = saldo >= 0 ? '#2E7D32' : '#C62828';

  var movs = [].concat(
    mv.map(function (v) { return { data: v.data, desc: 'Venda — ' + v.cliente, tipo: 'Entrada', valor: v.valor }; }),
    mc.map(function (c) { return { data: c.venc,  desc: c.desc,                 tipo: 'Saída',   valor: c.valor }; })
  );
  movs.sort(function (a, b) { return a.data > b.data ? -1 : 1; });

  var tb = document.getElementById('tbody-bal');

  if (!movs.length) {
    tb.innerHTML = '<tr><td colspan="4" class="empty">Sem movimentações neste período</td></tr>';
    return;
  }

  tb.innerHTML = movs.map(function (m) {
    var cor   = m.tipo === 'Entrada' ? 'color:#2E7D32' : 'color:#C62828';
    var badge = m.tipo === 'Entrada'
      ? '<span class="badge badge-entrada">Entrada</span>'
      : '<span class="badge badge-saida">Saída</span>';
    return '<tr>'
      + '<td>' + esc(m.data.split('-').reverse().join('/')) + '</td>'
      + '<td>' + esc(m.desc) + '</td>'
      + '<td>' + badge + '</td>'
      + '<td style="' + cor + ';font-weight:600">' + fmt(m.valor) + '</td>'
      + '</tr>';
  }).join('');
}

// ---- MODAIS ----
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

document.querySelectorAll('.modal-overlay').forEach(function (m) {
  m.addEventListener('click', function (e) {
    if (e.target === m) m.classList.remove('open');
  });
});

// ---- EXPORTAR CSV ----
function exportCSV(rows, filename) {
  var csv = rows.map(function (r) {
    return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\n');

  var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  var a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function exportVendas() {
  var rows = [['Data', 'Cliente', 'Valor (R$)', 'Pagamento', 'Status', 'Observação']].concat(
    vendas.map(function (v) {
      return [v.data, v.cliente, Number(v.valor || 0).toFixed(2), v.pagamento, v.status, v.obs];
    })
  );
  exportCSV(rows, 'dicassia_vendas.csv');
  showToast('CSV de vendas exportado!');
}

function exportContas() {
  var rows = [['Descrição', 'Valor (R$)', 'Vencimento', 'Status']].concat(
    contas.map(function (c) {
      return [c.desc, Number(c.valor || 0).toFixed(2), c.venc, c.status];
    })
  );
  exportCSV(rows, 'dicassia_contas.csv');
  showToast('CSV de contas exportado!');
}

document.getElementById('dashboard-start').value = dateInputValue(new Date(anoAtual, mesAtual, 1));
document.getElementById('dashboard-end').value = today;

carregarDados().catch(function (e) {
  showToast(e.message);
});
