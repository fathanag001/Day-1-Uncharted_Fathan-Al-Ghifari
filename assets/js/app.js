(function (root) {
  'use strict';

  var CalcApp = root.CalcApp;
  var registry = CalcApp.registry;
  var ui = CalcApp.ui;

  var main = document.getElementById('main');
  var searchInput = document.getElementById('search');
  var themeToggle = document.getElementById('theme-toggle');
  var themeLabel = themeToggle.querySelector('.theme-label');
  var yearElement = document.getElementById('year');
  var state = { query: '' };

  function applyTheme(theme) {
    var next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('calc-theme', next);
    } catch (error) {}
    themeLabel.textContent = next === 'dark' ? 'Terang' : 'Gelap';
    themeToggle.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
    themeToggle.setAttribute('aria-label', next === 'dark' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap');
  }

  function currentRoute() {
    var hash = window.location.hash || '#/';
    return hash.replace(/^#\/?/, '');
  }

  function isHome() {
    return currentRoute().indexOf('kalkulator/') !== 0;
  }

  function cardHtml(item) {
    return '<a class="calc-card" href="#/kalkulator/' + encodeURIComponent(item.id) + '">' +
      '<span class="calc-icon" aria-hidden="true">' + ui.escapeHtml(item.icon) + '</span>' +
      '<span class="calc-card-copy">' +
        '<span class="calc-category">' + ui.escapeHtml(item.category) + '</span>' +
        '<span class="calc-name">' + ui.escapeHtml(item.name) + '</span>' +
        '<span class="calc-desc">' + ui.escapeHtml(item.description) + '</span>' +
      '</span>' +
      '<span class="calc-arrow" aria-hidden="true">→</span>' +
    '</a>';
  }

  function renderHome() {
    var items = registry.all();
    var filtered = registry.search(state.query);
    var categories = new Set(items.map(function (item) { return item.category; }));
    var query = state.query.trim();

    main.innerHTML =
      '<section class="hero">' +
        '<div class="hero-copy">' +
          '<p class="eyebrow">Workshop Day 1 · Alat harian</p>' +
          '<h1>Hitung cepat,<br><span>tanpa ribet.</span></h1>' +
          '<p class="hero-lede">Kumpulan kalkulator untuk matematika, keuangan, kesehatan, dan konversi satuan. Semua berjalan langsung di browser.</p>' +
          '<div class="hero-actions">' +
            '<a class="primary-btn" href="#/kalkulator/scientific">Mulai menghitung</a>' +
            '<span class="hero-note">Tanpa instalasi, tanpa akun.</span>' +
          '</div>' +
        '</div>' +
        '<div class="hero-stats">' +
          '<div class="stat"><strong>' + items.length + '</strong><span>kalkulator</span></div>' +
          '<div class="stat"><strong>' + categories.size + '</strong><span>kategori</span></div>' +
          '<div class="stat"><strong>100%</strong><span>offline</span></div>' +
        '</div>' +
      '</section>' +
      '<section class="catalog" id="catalog">' +
        '<div class="section-head">' +
          '<div>' +
            '<p class="eyebrow">Katalog</p>' +
            '<h2>' + (query ? 'Hasil untuk “' + ui.escapeHtml(query) + '”' : 'Semua kalkulator') + '</h2>' +
          '</div>' +
          '<span class="count-badge">' + filtered.length + ' alat</span>' +
        '</div>' +
        (filtered.length
          ? '<div class="calc-grid">' + filtered.map(cardHtml).join('') + '</div>'
          : '<div class="empty-state">' +
              '<p>Belum ada kalkulator yang cocok dengan pencarian itu.</p>' +
              '<button type="button" class="ghost-btn" id="clear-search">Hapus pencarian</button>' +
            '</div>') +
      '</section>';

    var clearButton = document.getElementById('clear-search');
    if (clearButton) {
      clearButton.addEventListener('click', function () {
        state.query = '';
        searchInput.value = '';
        renderHome();
        searchInput.focus();
      });
    }

    document.title = 'Kalkulator Harian · Workshop Day 1';
  }

  function renderCalculator(item) {
    main.innerHTML =
      '<div class="page">' +
        '<nav class="breadcrumb" aria-label="Breadcrumb">' +
          '<a href="#/">Beranda</a>' +
          '<span aria-hidden="true">/</span>' +
          '<span aria-current="page">' + ui.escapeHtml(item.name) + '</span>' +
        '</nav>' +
        '<header class="page-head">' +
          '<span class="calc-icon calc-icon-large" aria-hidden="true">' + ui.escapeHtml(item.icon) + '</span>' +
          '<div>' +
            '<p class="eyebrow">' + ui.escapeHtml(item.category) + '</p>' +
            '<h1>' + ui.escapeHtml(item.name) + '</h1>' +
            '<p class="page-desc">' + ui.escapeHtml(item.description) + '</p>' +
          '</div>' +
        '</header>' +
        '<div id="calc-root"></div>' +
        '<a class="back-link" href="#/">← Kembali ke semua kalkulator</a>' +
      '</div>';

    var calculatorRoot = document.getElementById('calc-root');
    try {
      item.render(calculatorRoot);
    } catch (error) {
      calculatorRoot.innerHTML = '<div class="result-panel"><p class="result-error">' +
        ui.escapeHtml(error.message) + '</p></div>';
    }

    document.title = item.name + ' · Kalkulator Harian';
  }

  function renderNotFound() {
    main.innerHTML =
      '<div class="page not-found">' +
        '<p class="eyebrow">404</p>' +
        '<h1>Kalkulator tidak ditemukan</h1>' +
        '<p class="page-desc">Alamat yang Anda buka tidak tersedia atau sudah berubah.</p>' +
        '<a class="primary-btn" href="#/">Kembali ke beranda</a>' +
      '</div>';
    document.title = 'Tidak ditemukan · Kalkulator Harian';
  }

  function route() {
    var path = currentRoute();
    var parts = path.split('/');

    if (parts[0] === 'kalkulator' && parts[1]) {
      var item = registry.get(decodeURIComponent(parts[1]));
      if (!item) {
        renderNotFound();
        return;
      }
      renderCalculator(item);
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    renderHome();
  }

  themeToggle.addEventListener('click', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  searchInput.addEventListener('input', function () {
    state.query = searchInput.value;
    if (isHome()) {
      renderHome();
    } else {
      window.location.hash = '#/';
    }
  });

  searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      state.query = '';
      searchInput.value = '';
      if (isHome()) renderHome();
      searchInput.blur();
    }
  });

  document.addEventListener('keydown', function (event) {
    var tag = document.activeElement ? document.activeElement.tagName : '';
    var typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    if (event.key === '/' && !typing) {
      event.preventDefault();
      searchInput.focus();
    }
  });

  window.addEventListener('hashchange', route);

  if (yearElement) yearElement.textContent = new Date().getFullYear();
  applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
  route();
})(window);
