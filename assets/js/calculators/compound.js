(function (root) {
  'use strict';

  var CalcApp = root.CalcApp;
  var ui = CalcApp.ui;
  var format = CalcApp.format;

  function compute(input) {
    var options = input || {};
    var principal = Number(options.principal);
    var annualRate = Number(options.annualRate);
    var years = Number(options.years);
    var frequency = options.compoundsPerYear === undefined ? 12 : options.compoundsPerYear;

    if (!isFinite(principal) || principal <= 0) throw new Error('Modal awal harus lebih dari nol.');
    if (!isFinite(annualRate) || annualRate < 0) throw new Error('Suku bunga tidak boleh negatif.');
    if (!isFinite(years) || years <= 0) throw new Error('Lama investasi harus lebih dari nol.');

    var rate = annualRate / 100;
    var amount;
    var effectiveRate;

    if (frequency === 'continuous') {
      amount = principal * Math.exp(rate * years);
      effectiveRate = (Math.exp(rate) - 1) * 100;
    } else {
      var periods = Number(frequency);
      if (!isFinite(periods) || periods <= 0) throw new Error('Frekuensi majemuk tidak valid.');
      amount = principal * Math.pow(1 + rate / periods, periods * years);
      effectiveRate = (Math.pow(1 + rate / periods, periods) - 1) * 100;
    }

    return {
      principal: principal,
      finalAmount: amount,
      interest: amount - principal,
      effectiveRate: effectiveRate,
      years: years,
      compoundsPerYear: frequency
    };
  }

  function render(container) {
    ui.mount(container,
      '<div class="calc-layout">' +
        '<div class="calc-panel">' +
          ui.fieldGrid(
            ui.inputField({
              id: 'compound-principal',
              label: 'Modal awal',
              value: '10000000',
              min: '0',
              suffix: 'Rp'
            }),
            ui.inputField({
              id: 'compound-rate',
              label: 'Suku bunga tahunan',
              value: '6',
              min: '0',
              step: '0.01',
              suffix: '%'
            }),
            ui.inputField({
              id: 'compound-years',
              label: 'Lama investasi',
              value: '5',
              min: '0.1',
              step: '0.5',
              suffix: 'tahun'
            }),
            ui.selectField({
              id: 'compound-frequency',
              label: 'Frekuensi bunga majemuk',
              value: '12',
              options: [
                { value: '1', label: 'Tahunan (1×)' },
                { value: '2', label: 'Semesteran (2×)' },
                { value: '4', label: 'Triwulanan (4×)' },
                { value: '12', label: 'Bulanan (12×)' },
                { value: '52', label: 'Mingguan (52×)' },
                { value: '365', label: 'Harian (365×)' },
                { value: 'continuous', label: 'Kontinu' }
              ]
            })
          ) +
        '</div>' +
        ui.resultShell('compound-result') +
      '</div>'
    );

    var principalInput = container.querySelector('#compound-principal');
    var rateInput = container.querySelector('#compound-rate');
    var yearsInput = container.querySelector('#compound-years');
    var frequencySelect = container.querySelector('#compound-frequency');

    function calculate() {
      try {
        var frequency = frequencySelect.value === 'continuous' ? 'continuous' : Number(frequencySelect.value);
        var result = compute({
          principal: format.parseNumber(principalInput.value),
          annualRate: format.parseNumber(rateInput.value),
          years: format.parseNumber(yearsInput.value),
          compoundsPerYear: frequency
        });

        ui.result('compound-result', [
          { label: 'Nilai akhir', value: format.formatCurrency(result.finalAmount), strong: true },
          { label: 'Bunga diperoleh', value: format.formatCurrency(result.interest) },
          { label: 'Modal awal', value: format.formatCurrency(result.principal) },
          { label: 'Bunga efektif per tahun', value: format.formatNumber(result.effectiveRate, 4) + '%' },
          { label: 'Lama investasi', value: format.formatNumber(result.years, 4) + ' tahun' }
        ], 'Bunga majemuk dihitung tanpa setoran tambahan.');
      } catch (error) {
        ui.errorResult('compound-result', error.message);
      }
    }

    [principalInput, rateInput, yearsInput, frequencySelect].forEach(function (input) {
      input.addEventListener('input', calculate);
      input.addEventListener('change', calculate);
    });

    calculate();
  }

  CalcApp.register({
    id: 'compound',
    name: 'Kalkulator Bunga Majemuk',
    description: 'Lihat pertumbuhan investasi dengan bunga majemuk dan bandingkan frekuensi perhitungannya.',
    category: 'Keuangan',
    icon: '↗',
    keywords: ['bunga majemuk', 'compound interest', 'investasi', 'tabungan', 'deposito'],
    compute: compute,
    render: render
  });
})(typeof window !== 'undefined' ? window : globalThis);
