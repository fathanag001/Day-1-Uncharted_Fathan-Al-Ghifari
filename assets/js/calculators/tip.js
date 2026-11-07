(function (root) {
  'use strict';

  var CalcApp = root.CalcApp;
  var ui = CalcApp.ui;
  var format = CalcApp.format;

  function compute(input) {
    var options = input || {};
    var bill = Number(options.bill);
    var tipPercent = Number(options.tipPercent === undefined ? 15 : options.tipPercent);
    var taxPercent = Number(options.taxPercent || 0);
    var people = Number(options.people === undefined ? 1 : options.people);

    if (!isFinite(bill) || bill < 0) throw new Error('Jumlah tagihan tidak valid.');
    if (!isFinite(tipPercent) || tipPercent < 0) throw new Error('Persentase tip tidak valid.');
    if (!isFinite(taxPercent) || taxPercent < 0) throw new Error('Persentase pajak tidak valid.');
    if (!Number.isInteger(people) || people < 1) throw new Error('Jumlah orang minimal satu.');

    var tax = bill * taxPercent / 100;
    var tip = bill * tipPercent / 100;
    var total = bill + tax + tip;

    return {
      bill: bill,
      tax: tax,
      tip: tip,
      total: total,
      people: people,
      perPerson: total / people,
      tipPerPerson: tip / people
    };
  }

  function render(container) {
    ui.mount(container,
      '<div class="calc-layout">' +
        '<div class="calc-panel">' +
          ui.fieldGrid(
            ui.inputField({
              id: 'tip-bill',
              label: 'Jumlah tagihan',
              value: '250000',
              min: '0',
              suffix: 'Rp'
            }),
            ui.inputField({
              id: 'tip-percent',
              label: 'Tip',
              value: '15',
              min: '0',
              step: '0.5',
              suffix: '%'
            }),
            ui.inputField({
              id: 'tip-tax',
              label: 'Pajak / service',
              value: '0',
              min: '0',
              step: '0.5',
              suffix: '%'
            }),
            ui.inputField({
              id: 'tip-people',
              label: 'Jumlah orang',
              value: '2',
              min: '1',
              step: '1',
              suffix: 'orang'
            })
          ) +
          '<div class="quick-row">' +
            '<span class="quick-label">Tip cepat</span>' +
            ui.chip('10%', '10', false) +
            ui.chip('15%', '15', true) +
            ui.chip('18%', '18', false) +
            ui.chip('20%', '20', false) +
          '</div>' +
        '</div>' +
        ui.resultShell('tip-result') +
      '</div>'
    );

    var billInput = container.querySelector('#tip-bill');
    var percentInput = container.querySelector('#tip-percent');
    var taxInput = container.querySelector('#tip-tax');
    var peopleInput = container.querySelector('#tip-people');

    function calculate() {
      try {
        var result = compute({
          bill: format.parseNumber(billInput.value),
          tipPercent: format.parseNumber(percentInput.value),
          taxPercent: format.parseNumber(taxInput.value),
          people: format.parseNumber(peopleInput.value)
        });

        ui.result('tip-result', [
          { label: 'Bayar per orang', value: format.formatCurrency(result.perPerson), strong: true },
          { label: 'Total tagihan', value: format.formatCurrency(result.total) },
          { label: 'Jumlah tip', value: format.formatCurrency(result.tip) },
          { label: 'Tip per orang', value: format.formatCurrency(result.tipPerPerson) },
          { label: 'Pajak / service', value: format.formatCurrency(result.tax) },
          { label: 'Tagihan dasar', value: format.formatCurrency(result.bill) }
        ], 'Dibagi rata untuk ' + format.plural(result.people, 'orang', 'orang') + '.');
      } catch (error) {
        ui.errorResult('tip-result', error.message);
      }
    }

    [billInput, percentInput, taxInput, peopleInput].forEach(function (input) {
      input.addEventListener('input', calculate);
    });

    container.querySelectorAll('.chip[data-value]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        percentInput.value = chip.getAttribute('data-value');
        container.querySelectorAll('.chip[data-value]').forEach(function (item) {
          item.classList.toggle('is-active', item === chip);
        });
        calculate();
      });
    });

    calculate();
  }

  CalcApp.register({
    id: 'tip',
    name: 'Kalkulator Tip & Bagi Tagihan',
    description: 'Hitung tip, pajak, dan pembagian tagihan yang adil untuk setiap orang.',
    category: 'Keuangan',
    icon: '÷',
    keywords: ['tip', 'service', 'pajak', 'bagi tagihan', 'split bill', 'restoran'],
    compute: compute,
    render: render
  });
})(typeof window !== 'undefined' ? window : globalThis);
