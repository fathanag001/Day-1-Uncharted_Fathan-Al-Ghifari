(function (root) {
  'use strict';

  var CalcApp = root.CalcApp;
  var ui = CalcApp.ui;
  var format = CalcApp.format;

  var categories = {
    length: {
      label: 'Panjang',
      units: {
        km: { label: 'Kilometer', factor: 1000 },
        m: { label: 'Meter', factor: 1 },
        cm: { label: 'Sentimeter', factor: 0.01 },
        mm: { label: 'Milimeter', factor: 0.001 },
        mi: { label: 'Mil', factor: 1609.344 },
        yd: { label: 'Yard', factor: 0.9144 },
        ft: { label: 'Kaki', factor: 0.3048 },
        in: { label: 'Inci', factor: 0.0254 }
      }
    },
    mass: {
      label: 'Massa',
      units: {
        kg: { label: 'Kilogram', factor: 1 },
        g: { label: 'Gram', factor: 0.001 },
        mg: { label: 'Miligram', factor: 0.000001 },
        ton: { label: 'Ton', factor: 1000 },
        lb: { label: 'Pon', factor: 0.45359237 },
        oz: { label: 'Ons', factor: 0.028349523125 }
      }
    },
    temperature: {
      label: 'Suhu',
      units: {
        c: { label: 'Celsius', factor: 1 },
        f: { label: 'Fahrenheit', factor: 1 },
        k: { label: 'Kelvin', factor: 1 }
      }
    },
    area: {
      label: 'Luas',
      units: {
        m2: { label: 'Meter persegi', factor: 1 },
        km2: { label: 'Kilometer persegi', factor: 1000000 },
        cm2: { label: 'Sentimeter persegi', factor: 0.0001 },
        ha: { label: 'Hektare', factor: 10000 },
        acre: { label: 'Acre', factor: 4046.8564224 },
        ft2: { label: 'Kaki persegi', factor: 0.09290304 }
      }
    },
    volume: {
      label: 'Volume',
      units: {
        l: { label: 'Liter', factor: 1 },
        ml: { label: 'Mililiter', factor: 0.001 },
        m3: { label: 'Meter kubik', factor: 1000 },
        gal: { label: 'Galon (US)', factor: 3.785411784 },
        qt: { label: 'Quart (US)', factor: 0.946352946 },
        cup: { label: 'Cup (US)', factor: 0.2365882365 }
      }
    },
    speed: {
      label: 'Kecepatan',
      units: {
        mps: { label: 'Meter/detik', factor: 1 },
        kmh: { label: 'Kilometer/jam', factor: 0.2777777778 },
        mph: { label: 'Mil/jam', factor: 0.44704 },
        knot: { label: 'Knot', factor: 0.5144444444 }
      }
    },
    time: {
      label: 'Waktu',
      units: {
        second: { label: 'Detik', factor: 1 },
        minute: { label: 'Menit', factor: 60 },
        hour: { label: 'Jam', factor: 3600 },
        day: { label: 'Hari', factor: 86400 },
        week: { label: 'Minggu', factor: 604800 },
        year: { label: 'Tahun', factor: 31557600 }
      }
    },
    data: {
      label: 'Data',
      units: {
        byte: { label: 'Byte', factor: 1 },
        kb: { label: 'Kilobyte', factor: 1024 },
        mb: { label: 'Megabyte', factor: 1048576 },
        gb: { label: 'Gigabyte', factor: 1073741824 },
        tb: { label: 'Terabyte', factor: 1099511627776 }
      }
    }
  };

  function toCelsius(value, unit) {
    if (unit === 'f') return (value - 32) * 5 / 9;
    if (unit === 'k') return value - 273.15;
    return value;
  }

  function fromCelsius(value, unit) {
    if (unit === 'f') return value * 9 / 5 + 32;
    if (unit === 'k') return value + 273.15;
    return value;
  }

  function convert(categoryKey, from, to, value) {
    var category = categories[categoryKey];
    if (!category) throw new Error('Kategori satuan tidak dikenal.');
    if (!category.units[from] || !category.units[to]) throw new Error('Satuan tidak dikenal.');

    var number = Number(value);
    if (!isFinite(number)) throw new Error('Nilai tidak valid.');

    if (categoryKey === 'temperature') {
      return fromCelsius(toCelsius(number, from), to);
    }

    return number * category.units[from].factor / category.units[to].factor;
  }

  function compute(input) {
    var options = input || {};
    var categoryKey = options.category || 'length';
    var from = options.from;
    var to = options.to;
    var value = Number(options.value);

    var category = categories[categoryKey];
    if (!category) throw new Error('Kategori satuan tidak dikenal.');
    if (!category.units[from] || !category.units[to]) throw new Error('Satuan tidak dikenal.');
    if (!isFinite(value)) throw new Error('Nilai tidak valid.');

    return {
      category: categoryKey,
      categoryLabel: category.label,
      from: from,
      to: to,
      value: value,
      result: convert(categoryKey, from, to, value),
      rate: convert(categoryKey, from, to, 1)
    };
  }

  function unitOptions(categoryKey, selected) {
    var category = categories[categoryKey];
    return Object.keys(category.units).map(function (key) {
      return '<option value="' + key + '"' + (key === selected ? ' selected' : '') + '>' +
        ui.escapeHtml(category.units[key].label) + '</option>';
    }).join('');
  }

  function render(container) {
    var categoryOptions = Object.keys(categories).map(function (key) {
      return { value: key, label: categories[key].label };
    });

    ui.mount(container,
      '<div class="calc-layout">' +
        '<div class="calc-panel">' +
          '<div class="field-grid">' +
            ui.selectField({
              id: 'unit-category',
              label: 'Kategori',
              options: categoryOptions,
              value: 'length'
            }) +
            ui.inputField({
              id: 'unit-value',
              label: 'Nilai',
              value: '1',
              step: 'any'
            }) +
          '</div>' +
          '<div class="unit-row">' +
            '<label class="field" for="unit-from">' +
              '<span class="field-label">Dari</span>' +
              '<span class="input-wrap"><select id="unit-from"></select></span>' +
            '</label>' +
            '<button type="button" class="swap-btn" id="unit-swap" aria-label="Tukar satuan">⇄</button>' +
            '<label class="field" for="unit-to">' +
              '<span class="field-label">Ke</span>' +
              '<span class="input-wrap"><select id="unit-to"></select></span>' +
            '</label>' +
          '</div>' +
        '</div>' +
        ui.resultShell('unit-result') +
      '</div>'
    );

    var categorySelect = container.querySelector('#unit-category');
    var valueInput = container.querySelector('#unit-value');
    var fromSelect = container.querySelector('#unit-from');
    var toSelect = container.querySelector('#unit-to');

    function fillUnits() {
      var keys = Object.keys(categories[categorySelect.value].units);
      fromSelect.innerHTML = unitOptions(categorySelect.value, keys[0]);
      toSelect.innerHTML = unitOptions(categorySelect.value, keys[1] || keys[0]);
    }

    function calculate() {
      try {
        var result = compute({
          category: categorySelect.value,
          from: fromSelect.value,
          to: toSelect.value,
          value: format.parseNumber(valueInput.value)
        });
        var fromLabel = categories[result.category].units[result.from].label;
        var toLabel = categories[result.category].units[result.to].label;

        ui.result('unit-result', [
          { label: 'Hasil', value: format.formatNumber(result.result, 8) + ' ' + result.to, strong: true },
          { label: 'Nilai awal', value: format.formatNumber(result.value, 8) + ' ' + result.from },
          { label: 'Konversi', value: '1 ' + result.from + ' = ' + format.formatNumber(result.rate, 8) + ' ' + result.to },
          { label: 'Kategori', value: result.categoryLabel }
        ], fromLabel + ' ke ' + toLabel + '.');
      } catch (error) {
        ui.errorResult('unit-result', error.message);
      }
    }

    categorySelect.addEventListener('change', function () {
      fillUnits();
      calculate();
    });
    valueInput.addEventListener('input', calculate);
    fromSelect.addEventListener('change', calculate);
    toSelect.addEventListener('change', calculate);

    container.querySelector('#unit-swap').addEventListener('click', function () {
      var from = fromSelect.value;
      fromSelect.value = toSelect.value;
      toSelect.value = from;
      calculate();
    });

    fillUnits();
    calculate();
  }

  CalcApp.register({
    id: 'unit-converter',
    name: 'Konverter Satuan',
    description: 'Konversi panjang, massa, suhu, luas, volume, kecepatan, waktu, dan data dalam sekali klik.',
    category: 'Konversi',
    icon: '↔',
    keywords: ['konversi', 'satuan', 'unit', 'panjang', 'berat', 'suhu', 'volume', 'kecepatan'],
    compute: compute,
    convert: convert,
    categories: categories,
    render: render
  });
})(typeof window !== 'undefined' ? window : globalThis);
