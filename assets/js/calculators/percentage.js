(function (root) {
  'use strict';

  var CalcApp = root.CalcApp;
  var ui = CalcApp.ui;
  var format = CalcApp.format;

  function percentOf(percent, value) {
    return value * percent / 100;
  }

  function whatPercent(part, whole) {
    if (whole === 0) throw new Error('Nilai total tidak boleh nol.');
    return part / whole * 100;
  }

  function percentChange(from, to) {
    if (from === 0) throw new Error('Nilai awal tidak boleh nol.');
    return (to - from) / Math.abs(from) * 100;
  }

  function addPercent(value, percent) {
    return value * (1 + percent / 100);
  }

  function subtractPercent(value, percent) {
    return value * (1 - percent / 100);
  }

  var modes = {
    of: {
      labelA: 'Persentase (%)',
      labelB: 'Nilai',
      placeholderA: 'Contoh: 15',
      placeholderB: 'Contoh: 200000',
      mainLabel: 'Hasil',
      run: function (a, b) {
        return {
          value: percentOf(a, b),
          note: format.formatNumber(a, 4) + '% dari ' + format.formatNumber(b, 4) + ' = ' + format.formatNumber(percentOf(a, b), 4)
        };
      }
    },
    what: {
      labelA: 'Nilai bagian',
      labelB: 'Nilai total',
      placeholderA: 'Contoh: 30',
      placeholderB: 'Contoh: 200',
      mainLabel: 'Persentase',
      run: function (a, b) {
        return {
          value: whatPercent(a, b),
          suffix: '%',
          note: format.formatNumber(a, 4) + ' adalah ' + format.formatNumber(whatPercent(a, b), 4) + '% dari ' + format.formatNumber(b, 4)
        };
      }
    },
    change: {
      labelA: 'Nilai awal',
      labelB: 'Nilai akhir',
      placeholderA: 'Contoh: 200',
      placeholderB: 'Contoh: 250',
      mainLabel: 'Perubahan',
      run: function (a, b) {
        var value = percentChange(a, b);
        return {
          value: value,
          suffix: '%',
          note: value === 0 ? 'Tidak ada perubahan.' : (value > 0 ? 'Naik' : 'Turun') + ' sebesar ' + format.formatNumber(Math.abs(value), 4) + '%'
        };
      }
    },
    increase: {
      labelA: 'Nilai awal',
      labelB: 'Kenaikan (%)',
      placeholderA: 'Contoh: 200000',
      placeholderB: 'Contoh: 10',
      mainLabel: 'Nilai setelah kenaikan',
      run: function (a, b) {
        var value = addPercent(a, b);
        return {
          value: value,
          note: 'Kenaikan: ' + format.formatNumber(value - a, 4)
        };
      }
    },
    decrease: {
      labelA: 'Nilai awal',
      labelB: 'Penurunan (%)',
      placeholderA: 'Contoh: 200000',
      placeholderB: 'Contoh: 10',
      mainLabel: 'Nilai setelah penurunan',
      run: function (a, b) {
        var value = subtractPercent(a, b);
        return {
          value: value,
          note: 'Penurunan: ' + format.formatNumber(a - value, 4)
        };
      }
    }
  };

  function compute(input) {
    var options = input || {};
    var mode = modes[options.mode] ? options.mode : 'of';
    var a = format.parseNumber(options.a);
    var b = format.parseNumber(options.b);
    if (!isFinite(a) || !isFinite(b)) throw new Error('Masukkan kedua nilai dengan benar.');
    var result = modes[mode].run(a, b);
    return {
      mode: mode,
      value: result.value,
      note: result.note
    };
  }

  function render(container) {
    var modeOptions = [
      { value: 'of', label: 'Berapa X% dari Y?' },
      { value: 'what', label: 'A adalah berapa persen dari B?' },
      { value: 'change', label: 'Perubahan dari A ke B' },
      { value: 'increase', label: 'Naikkan nilai sebesar X%' },
      { value: 'decrease', label: 'Turunkan nilai sebesar X%' }
    ];

    ui.mount(container,
      '<div class="calc-layout">' +
        '<div class="calc-panel">' +
          '<div class="field-grid">' +
            ui.selectField({
              id: 'pct-mode',
              label: 'Jenis perhitungan',
              options: modeOptions,
              value: 'of'
            }) +
          '</div>' +
          ui.fieldGrid(
            ui.inputField({ id: 'pct-a', label: 'Persentase (%)', value: '15', placeholder: 'Contoh: 15' }),
            ui.inputField({ id: 'pct-b', label: 'Nilai', value: '200000', placeholder: 'Contoh: 200000' })
          ) +
          '<div class="quick-row">' +
            '<span class="quick-label">Coba cepat</span>' +
            '<button type="button" class="chip" data-mode="of" data-value="15|200000">15% dari 200.000</button>' +
            '<button type="button" class="chip" data-mode="what" data-value="30|200">30 dari 200</button>' +
            '<button type="button" class="chip" data-mode="change" data-value="200|250">200 → 250</button>' +
          '</div>' +
        '</div>' +
        ui.resultShell('pct-result') +
      '</div>'
    );

    var modeSelect = container.querySelector('#pct-mode');
    var inputA = container.querySelector('#pct-a');
    var inputB = container.querySelector('#pct-b');
    var labelA = container.querySelector('label[for="pct-a"] .field-label');
    var labelB = container.querySelector('label[for="pct-b"] .field-label');

    function syncMode() {
      var mode = modes[modeSelect.value];
      labelA.textContent = mode.labelA;
      labelB.textContent = mode.labelB;
      inputA.placeholder = mode.placeholderA;
      inputB.placeholder = mode.placeholderB;
      calculate();
    }

    function calculate() {
      var mode = modes[modeSelect.value];
      var a = format.parseNumber(inputA.value);
      var b = format.parseNumber(inputB.value);

      if (!isFinite(a) || !isFinite(b)) {
        ui.clearResult('pct-result');
        return;
      }

      try {
        var result = mode.run(a, b);
        var mainValue = format.formatNumber(result.value, 4) + (result.suffix || '');
        ui.result('pct-result', [
          { label: mode.mainLabel, value: mainValue, strong: true },
          { label: mode.labelA, value: format.formatNumber(a, 4) },
          { label: mode.labelB, value: format.formatNumber(b, 4) }
        ], result.note || '');
      } catch (error) {
        ui.errorResult('pct-result', error.message);
      }
    }

    modeSelect.addEventListener('change', syncMode);
    inputA.addEventListener('input', calculate);
    inputB.addEventListener('input', calculate);

    container.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var parts = chip.getAttribute('data-value').split('|');
        var mode = chip.getAttribute('data-mode');
        inputA.value = parts[0];
        inputB.value = parts[1];
        if (mode) {
          modeSelect.value = mode;
          syncMode();
        } else {
          calculate();
        }
        container.querySelectorAll('.chip').forEach(function (item) {
          item.classList.toggle('is-active', item === chip);
        });
      });
    });

    syncMode();
  }

  CalcApp.register({
    id: 'percentage',
    name: 'Kalkulator Persentase',
    description: 'Hitung persentase, proporsi, perubahan, kenaikan, dan penurunan nilai.',
    category: 'Matematika',
    icon: '%',
    keywords: ['persen', 'persentase', 'percentage', 'diskon', 'kenaikan', 'penurunan'],
    compute: compute,
    percentOf: percentOf,
    whatPercent: whatPercent,
    percentChange: percentChange,
    render: render
  });
})(typeof window !== 'undefined' ? window : globalThis);
