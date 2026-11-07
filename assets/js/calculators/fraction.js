(function (root) {
  'use strict';

  var CalcApp = root.CalcApp;
  var ui = CalcApp.ui;
  var format = CalcApp.format;

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      var temp = b;
      b = a % b;
      a = temp;
    }
    return a || 1;
  }

  function simplify(numerator, denominator) {
    if (denominator === 0) throw new Error('Penyebut tidak boleh nol.');
    if (denominator < 0) {
      numerator = -numerator;
      denominator = -denominator;
    }
    var divisor = gcd(numerator, denominator);
    return {
      numerator: numerator / divisor,
      denominator: denominator / divisor
    };
  }

  function mixedText(numerator, denominator) {
    var sign = numerator < 0 ? '-' : '';
    var absNumerator = Math.abs(numerator);
    var whole = Math.floor(absNumerator / denominator);
    var remainder = absNumerator % denominator;
    if (remainder === 0) return sign + whole;
    if (whole === 0) return sign + remainder + '/' + denominator;
    return sign + whole + ' ' + remainder + '/' + denominator;
  }

  var operations = {
    add: { label: 'Penjumlahan (+)', symbol: '+', run: function (a, b, c, d) { return [a * d + c * b, b * d]; } },
    subtract: { label: 'Pengurangan (−)', symbol: '−', run: function (a, b, c, d) { return [a * d - c * b, b * d]; } },
    multiply: { label: 'Perkalian (×)', symbol: '×', run: function (a, b, c, d) { return [a * c, b * d]; } },
    divide: { label: 'Pembagian (÷)', symbol: '÷', run: function (a, b, c, d) {
      if (c === 0) throw new Error('Tidak bisa membagi dengan pecahan bernilai nol.');
      return [a * d, b * c];
    } }
  };

  function compute(input) {
    var options = input || {};
    var operation = operations[options.operation] ? options.operation : 'add';
    var a = Number(options.numerator1);
    var b = Number(options.denominator1);
    var c = Number(options.numerator2);
    var d = Number(options.denominator2);

    if (![a, b, c, d].every(Number.isInteger)) {
      throw new Error('Pembilang dan penyebut harus bilangan bulat.');
    }
    if (b === 0 || d === 0) throw new Error('Penyebut tidak boleh nol.');

    var raw = operations[operation].run(a, b, c, d);
    var simplified = simplify(raw[0], raw[1]);

    return {
      operation: operation,
      numerator: simplified.numerator,
      denominator: simplified.denominator,
      rawNumerator: raw[0],
      rawDenominator: raw[1],
      decimal: simplified.numerator / simplified.denominator,
      mixed: mixedText(simplified.numerator, simplified.denominator)
    };
  }

  function render(container) {
    var operationOptions = Object.keys(operations).map(function (key) {
      return { value: key, label: operations[key].label };
    });

    ui.mount(container,
      '<div class="calc-layout">' +
        '<div class="calc-panel">' +
          '<div class="field-grid">' +
            ui.selectField({
              id: 'frac-op',
              label: 'Operasi',
              options: operationOptions,
              value: 'add'
            }) +
          '</div>' +
          '<div class="fraction-grid">' +
            '<div class="fraction-group">' +
              '<span class="fraction-title">Pecahan pertama</span>' +
              '<div class="fraction-stack">' +
                '<label class="visually-hidden" for="frac-a">Pembilang pertama</label>' +
                '<input id="frac-a" type="number" step="1" value="1" inputmode="numeric">' +
                '<span class="fraction-line"></span>' +
                '<label class="visually-hidden" for="frac-b">Penyebut pertama</label>' +
                '<input id="frac-b" type="number" step="1" value="2" inputmode="numeric">' +
              '</div>' +
            '</div>' +
            '<div class="fraction-symbol" id="frac-symbol" aria-hidden="true">+</div>' +
            '<div class="fraction-group">' +
              '<span class="fraction-title">Pecahan kedua</span>' +
              '<div class="fraction-stack">' +
                '<label class="visually-hidden" for="frac-c">Pembilang kedua</label>' +
                '<input id="frac-c" type="number" step="1" value="1" inputmode="numeric">' +
                '<span class="fraction-line"></span>' +
                '<label class="visually-hidden" for="frac-d">Penyebut kedua</label>' +
                '<input id="frac-d" type="number" step="1" value="3" inputmode="numeric">' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="quick-row">' +
            '<span class="quick-label">Contoh</span>' +
            '<button type="button" class="chip" data-example="1|2|1|3|add">1/2 + 1/3</button>' +
            '<button type="button" class="chip" data-example="3|4|1|4|subtract">3/4 − 1/4</button>' +
            '<button type="button" class="chip" data-example="2|3|3|5|multiply">2/3 × 3/5</button>' +
            '<button type="button" class="chip" data-example="1|2|3|4|divide">1/2 ÷ 3/4</button>' +
          '</div>' +
        '</div>' +
        ui.resultShell('frac-result') +
      '</div>'
    );

    var operationSelect = container.querySelector('#frac-op');
    var symbol = container.querySelector('#frac-symbol');
    var inputA = container.querySelector('#frac-a');
    var inputB = container.querySelector('#frac-b');
    var inputC = container.querySelector('#frac-c');
    var inputD = container.querySelector('#frac-d');

    function calculate() {
      var a = Number(inputA.value);
      var b = Number(inputB.value);
      var c = Number(inputC.value);
      var d = Number(inputD.value);

      if (!isFinite(a) || !isFinite(b) || !isFinite(c) || !isFinite(d)) {
        ui.clearResult('frac-result');
        return;
      }

      try {
        var result = compute({
          operation: operationSelect.value,
          numerator1: a,
          denominator1: b,
          numerator2: c,
          denominator2: d
        });
        var op = operations[result.operation];
        ui.result('frac-result', [
          { label: 'Hasil', value: result.numerator + '/' + result.denominator, strong: true },
          { label: 'Bentuk campuran', value: result.mixed },
          { label: 'Desimal', value: format.formatNumber(result.decimal, 10) },
          { label: 'Sebelum disederhanakan', value: result.rawNumerator + '/' + result.rawDenominator }
        ], format.formatNumber(a, 4) + '/' + format.formatNumber(b, 4) + ' ' + op.symbol + ' ' +
          format.formatNumber(c, 4) + '/' + format.formatNumber(d, 4));
      } catch (error) {
        ui.errorResult('frac-result', error.message);
      }
    }

    function updateSymbol() {
      symbol.textContent = operations[operationSelect.value].symbol;
    }

    operationSelect.addEventListener('change', function () {
      updateSymbol();
      calculate();
    });

    [inputA, inputB, inputC, inputD].forEach(function (input) {
      input.addEventListener('input', calculate);
    });

    container.querySelectorAll('[data-example]').forEach(function (button) {
      button.addEventListener('click', function () {
        var values = button.getAttribute('data-example').split('|');
        inputA.value = values[0];
        inputB.value = values[1];
        inputC.value = values[2];
        inputD.value = values[3];
        operationSelect.value = values[4];
        updateSymbol();
        calculate();
      });
    });

    updateSymbol();
    calculate();
  }

  CalcApp.register({
    id: 'fraction',
    name: 'Kalkulator Pecahan',
    description: 'Tambah, kurang, kali, dan bagi pecahan lengkap dengan penyederhanaan dan bentuk desimal.',
    category: 'Matematika',
    icon: '½',
    keywords: ['pecahan', 'fraction', 'pembilang', 'penyebut', 'desimal', 'campuran'],
    compute: compute,
    simplify: simplify,
    render: render
  });
})(typeof window !== 'undefined' ? window : globalThis);
