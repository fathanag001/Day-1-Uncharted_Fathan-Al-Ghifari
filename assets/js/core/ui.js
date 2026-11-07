(function (root) {
  'use strict';

  var CalcApp = root.CalcApp = root.CalcApp || {};
  var ui = CalcApp.ui = CalcApp.ui || {};

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function attr(name, value) {
    if (value === undefined || value === null || value === '') return '';
    return ' ' + name + '="' + escapeHtml(value) + '"';
  }

  function mount(container, html) {
    container.innerHTML = html;
    return container;
  }

  function fieldGrid() {
    var fields = Array.prototype.slice.call(arguments).filter(Boolean);
    return '<div class="field-grid">' + fields.join('') + '</div>';
  }

  function inputField(options) {
    var id = options.id;
    var type = options.type || 'number';
    var inputAttrs = [
      attr('id', id),
      attr('type', type),
      attr('inputmode', options.inputmode || (type === 'number' ? 'decimal' : null)),
      attr('step', options.step === undefined ? (type === 'number' ? 'any' : null) : options.step),
      attr('min', options.min),
      attr('max', options.max),
      attr('placeholder', options.placeholder),
      attr('autocomplete', 'off'),
      attr('value', options.value)
    ].join('');

    var suffix = options.suffix
      ? '<span class="input-suffix">' + escapeHtml(options.suffix) + '</span>'
      : '';
    var hint = options.hint
      ? '<span class="field-hint">' + options.hint + '</span>'
      : '';

    return '<label class="field" for="' + escapeHtml(id) + '">' +
      '<span class="field-label">' + escapeHtml(options.label) + '</span>' +
      '<span class="input-wrap">' +
        '<input' + inputAttrs + '>' +
        suffix +
      '</span>' +
      hint +
    '</label>';
  }

  function selectField(options) {
    var value = options.value === undefined ? '' : String(options.value);
    var opts = (options.options || []).map(function (option) {
      var optionValue = String(option.value);
      var selected = optionValue === value ? ' selected' : '';
      return '<option value="' + escapeHtml(optionValue) + '"' + selected + '>' +
        escapeHtml(option.label) + '</option>';
    }).join('');

    var hint = options.hint
      ? '<span class="field-hint">' + options.hint + '</span>'
      : '';

    return '<label class="field" for="' + escapeHtml(options.id) + '">' +
      '<span class="field-label">' + escapeHtml(options.label) + '</span>' +
      '<span class="input-wrap">' +
        '<select id="' + escapeHtml(options.id) + '"' + attr('aria-label', options.ariaLabel) + '>' + opts + '</select>' +
      '</span>' +
      hint +
    '</label>';
  }

  function textareaField(options) {
    return '<label class="field field-wide" for="' + escapeHtml(options.id) + '">' +
      '<span class="field-label">' + escapeHtml(options.label) + '</span>' +
      '<textarea id="' + escapeHtml(options.id) + '" rows="' + (options.rows || 4) + '" ' +
        'placeholder="' + escapeHtml(options.placeholder || '') + '">' +
        escapeHtml(options.value || '') +
      '</textarea>' +
      (options.hint ? '<span class="field-hint">' + options.hint + '</span>' : '') +
    '</label>';
  }

  function resultShell(id) {
    return '<section class="result-panel" id="' + escapeHtml(id) + '" aria-live="polite">' +
      '<p class="result-placeholder">Isi data di atas untuk melihat hasil.</p>' +
    '</section>';
  }

  function result(id, rows, note) {
    var panel = document.getElementById(id);
    if (!panel) return;

    var body = rows.map(function (row) {
      var classes = ['result-row'];
      if (row.strong) classes.push('is-strong');
      if (row.wide) classes.push('is-wide');
      return '<div class="' + classes.join(' ') + '">' +
        '<span class="result-label">' + row.label + '</span>' +
        '<strong class="result-value">' + row.value + '</strong>' +
      '</div>';
    }).join('');

    panel.innerHTML = '<div class="result-grid">' + body + '</div>' +
      (note ? '<p class="result-note">' + note + '</p>' : '');
  }

  function clearResult(id) {
    var panel = document.getElementById(id);
    if (!panel) return;
    panel.innerHTML = '<p class="result-placeholder">Isi data di atas untuk melihat hasil.</p>';
  }

  function errorResult(id, message) {
    var panel = document.getElementById(id);
    if (!panel) return;
    panel.innerHTML = '<p class="result-error">' + escapeHtml(message) + '</p>';
  }

  function watch(container, handler) {
    var elements = container.querySelectorAll('input, select, textarea');
    Array.prototype.forEach.call(elements, function (element) {
      element.addEventListener('input', handler);
      element.addEventListener('change', handler);
    });
    return handler;
  }

  function readNumber(id) {
    var element = document.getElementById(id);
    if (!element) return NaN;
    return CalcApp.format.parseNumber(element.value);
  }

  function readValue(id) {
    var element = document.getElementById(id);
    return element ? element.value : '';
  }

  function isPositiveNumber(value) {
    return typeof value === 'number' && isFinite(value) && value > 0;
  }

  function isNonNegativeNumber(value) {
    return typeof value === 'number' && isFinite(value) && value >= 0;
  }

  function chip(label, value, active) {
    return '<button type="button" class="chip' + (active ? ' is-active' : '') + '" data-value="' +
      escapeHtml(value) + '">' + escapeHtml(label) + '</button>';
  }

  CalcApp.ui = {
    escapeHtml: escapeHtml,
    mount: mount,
    fieldGrid: fieldGrid,
    inputField: inputField,
    selectField: selectField,
    textareaField: textareaField,
    resultShell: resultShell,
    result: result,
    clearResult: clearResult,
    errorResult: errorResult,
    watch: watch,
    readNumber: readNumber,
    readValue: readValue,
    isPositiveNumber: isPositiveNumber,
    isNonNegativeNumber: isNonNegativeNumber,
    chip: chip
  };
})(typeof window !== 'undefined' ? window : globalThis);
