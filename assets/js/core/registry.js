(function (root) {
  'use strict';

  var CalcApp = root.CalcApp = root.CalcApp || {};
  var items = [];
  var byId = new Map();

  function normalize(value) {
    return String(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function register(definition) {
    if (!definition || !definition.id) {
      throw new Error('Kalkulator harus memiliki id.');
    }
    if (byId.has(definition.id)) {
      throw new Error('ID kalkulator duplikat: ' + definition.id);
    }

    var item = Object.assign({
      category: 'Umum',
      keywords: [],
      icon: '='
    }, definition);

    items.push(item);
    byId.set(item.id, item);
    return item;
  }

  function all() {
    return items.slice();
  }

  function get(id) {
    return byId.get(id) || null;
  }

  function search(query) {
    var term = normalize(query).trim();
    if (!term) return all();

    var words = term.split(/\s+/).filter(Boolean);
    return items.filter(function (item) {
      var haystack = normalize([
        item.name,
        item.description,
        item.category,
        (item.keywords || []).join(' ')
      ].join(' '));
      return words.every(function (word) {
        return haystack.indexOf(word) !== -1;
      });
    });
  }

  CalcApp.register = register;
  CalcApp.registry = {
    all: all,
    get: get,
    search: search
  };
})(typeof window !== 'undefined' ? window : globalThis);
