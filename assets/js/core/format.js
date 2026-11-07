(function (root) {
  'use strict';

  var CalcApp = root.CalcApp = root.CalcApp || {};

  function formatNumber(value, maxFractionDigits) {
    var digits = typeof maxFractionDigits === 'number' ? maxFractionDigits : 2;
    if (typeof value !== 'number' || !isFinite(value)) return '—';
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: digits
    }).format(value);
  }

  function formatCurrency(value) {
    if (typeof value !== 'number' || !isFinite(value)) return '—';
    return 'Rp ' + new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0
    }).format(Math.round(value));
  }

  function parseNumber(input) {
    if (typeof input === 'number') return input;
    if (input === null || input === undefined) return NaN;

    var text = String(input).trim().replace(/\s/g, '');
    if (!text) return NaN;

    if (text.indexOf(',') !== -1 && text.indexOf('.') !== -1) {
      if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
        text = text.replace(/\./g, '').replace(',', '.');
      } else {
        text = text.replace(/,/g, '');
      }
    } else if (text.indexOf(',') !== -1) {
      text = text.replace(',', '.');
    } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
      text = text.replace(/\./g, '');
    }

    return Number(text);
  }

  function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  function plural(value, singular, pluralForm) {
    return value + ' ' + (value === 1 ? singular : pluralForm);
  }

  CalcApp.format = {
    formatNumber: formatNumber,
    formatCurrency: formatCurrency,
    parseNumber: parseNumber,
    formatDate: formatDate,
    plural: plural
  };
})(typeof window !== 'undefined' ? window : globalThis);
