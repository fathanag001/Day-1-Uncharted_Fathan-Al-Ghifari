(function (root) {
  'use strict';

  var CalcApp = root.CalcApp;
  var ui = CalcApp.ui;
  var format = CalcApp.format;

  function compute(input) {
    var options = input || {};
    var price = Number(options.price);
    var discountPercent = Number(options.discountPercent);
    var taxPercent = Number(options.taxPercent || 0);

    if (!isFinite(price) || price < 0) throw new Error('Harga tidak valid.');
    if (!isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      throw new Error('Diskon harus di antara 0 dan 100%.');
    }
    if (!isFinite(taxPercent) || taxPercent < 0) throw new Error('Pajak tidak valid.');

    var discount = price * discountPercent / 100;
    var afterDiscount = price - discount;
    var tax = afterDiscount * taxPercent / 100;
    var finalPrice = afterDiscount + tax;

    return {
      price: price,
      discountPercent: discountPercent,
      discount: discount,
      afterDiscount: afterDiscount,
      tax: tax,
      finalPrice: finalPrice,
      savings: discount
    };
  }

  function render(container) {
    ui.mount(container,
      '<div class="calc-layout">' +
        '<div class="calc-panel">' +
          ui.fieldGrid(
            ui.inputField({
              id: 'discount-price',
              label: 'Harga awal',
              value: '500000',
              min: '0',
              suffix: 'Rp'
            }),
            ui.inputField({
              id: 'discount-percent',
              label: 'Diskon',
              value: '20',
              min: '0',
              max: '100',
              step: '1',
              suffix: '%'
            }),
            ui.inputField({
              id: 'discount-tax',
              label: 'Pajak setelah diskon',
              value: '0',
              min: '0',
              step: '0.5',
              suffix: '%'
            })
          ) +
          '<div class="quick-row">' +
            '<span class="quick-label">Diskon cepat</span>' +
            ui.chip('10%', '10', false) +
            ui.chip('20%', '20', true) +
            ui.chip('30%', '30', false) +
            ui.chip('50%', '50', false) +
          '</div>' +
        '</div>' +
        ui.resultShell('discount-result') +
      '</div>'
    );

    var priceInput = container.querySelector('#discount-price');
    var percentInput = container.querySelector('#discount-percent');
    var taxInput = container.querySelector('#discount-tax');

    function calculate() {
      try {
        var result = compute({
          price: format.parseNumber(priceInput.value),
          discountPercent: format.parseNumber(percentInput.value),
          taxPercent: format.parseNumber(taxInput.value)
        });

        ui.result('discount-result', [
          { label: 'Harga akhir', value: format.formatCurrency(result.finalPrice), strong: true },
          { label: 'Potongan harga', value: format.formatCurrency(result.discount) },
          { label: 'Harga setelah diskon', value: format.formatCurrency(result.afterDiscount) },
          { label: 'Pajak', value: format.formatCurrency(result.tax) },
          { label: 'Harga awal', value: format.formatCurrency(result.price) }
        ], 'Anda menghemat ' + format.formatCurrency(result.savings) + ' (' + format.formatNumber(result.discountPercent, 2) + '%).');
      } catch (error) {
        ui.errorResult('discount-result', error.message);
      }
    }

    [priceInput, percentInput, taxInput].forEach(function (input) {
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
    id: 'discount',
    name: 'Kalkulator Diskon',
    description: 'Hitung harga akhir setelah diskon dan pajak, serta jumlah uang yang dihemat.',
    category: 'Keuangan',
    icon: '−',
    keywords: ['diskon', 'discount', 'promo', 'potongan harga', 'hemat', 'pajak'],
    compute: compute,
    render: render
  });
})(typeof window !== 'undefined' ? window : globalThis);
