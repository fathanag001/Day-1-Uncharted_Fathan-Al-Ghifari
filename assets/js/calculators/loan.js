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
    var downPayment = Number(options.downPayment || 0);

    if (!isFinite(principal) || principal <= 0) throw new Error('Harga atau jumlah pinjaman harus lebih dari nol.');
    if (!isFinite(downPayment) || downPayment < 0) throw new Error('Uang muka tidak boleh negatif.');
    if (downPayment >= principal) throw new Error('Uang muka harus lebih kecil dari harga.');
    if (!isFinite(annualRate) || annualRate < 0) throw new Error('Suku bunga tidak boleh negatif.');
    if (!isFinite(years) || years <= 0) throw new Error('Tenor harus lebih dari nol.');

    var loanAmount = principal - downPayment;
    var months = Math.round(years * 12);
    if (months < 1) throw new Error('Tenor minimal satu bulan.');

    var monthlyRate = annualRate / 100 / 12;
    var monthlyPayment;
    if (monthlyRate === 0) {
      monthlyPayment = loanAmount / months;
    } else {
      var growth = Math.pow(1 + monthlyRate, months);
      monthlyPayment = loanAmount * monthlyRate * growth / (growth - 1);
    }

    var totalPayment = monthlyPayment * months;
    var firstInterest = loanAmount * monthlyRate;

    return {
      principal: principal,
      downPayment: downPayment,
      loanAmount: loanAmount,
      months: months,
      monthlyPayment: monthlyPayment,
      totalPayment: totalPayment,
      totalInterest: totalPayment - loanAmount,
      firstInterest: firstInterest,
      firstPrincipal: monthlyPayment - firstInterest
    };
  }

  function render(container) {
    ui.mount(container,
      '<div class="calc-layout">' +
        '<div class="calc-panel">' +
          ui.fieldGrid(
            ui.inputField({
              id: 'loan-principal',
              label: 'Harga properti / jumlah pinjaman',
              value: '600000000',
              min: '0',
              suffix: 'Rp'
            }),
            ui.inputField({
              id: 'loan-dp',
              label: 'Uang muka (DP)',
              value: '120000000',
              min: '0',
              suffix: 'Rp'
            }),
            ui.inputField({
              id: 'loan-rate',
              label: 'Suku bunga tahunan',
              value: '8',
              min: '0',
              step: '0.01',
              suffix: '%'
            }),
            ui.inputField({
              id: 'loan-years',
              label: 'Tenor',
              value: '10',
              min: '0.5',
              step: '0.5',
              suffix: 'tahun'
            })
          ) +
        '</div>' +
        ui.resultShell('loan-result') +
      '</div>'
    );

    var principalInput = container.querySelector('#loan-principal');
    var dpInput = container.querySelector('#loan-dp');
    var rateInput = container.querySelector('#loan-rate');
    var yearsInput = container.querySelector('#loan-years');

    function calculate() {
      try {
        var result = compute({
          principal: format.parseNumber(principalInput.value),
          downPayment: format.parseNumber(dpInput.value),
          annualRate: format.parseNumber(rateInput.value),
          years: format.parseNumber(yearsInput.value)
        });

        ui.result('loan-result', [
          { label: 'Cicilan per bulan', value: format.formatCurrency(result.monthlyPayment), strong: true },
          { label: 'Jumlah pinjaman', value: format.formatCurrency(result.loanAmount) },
          { label: 'Total pembayaran', value: format.formatCurrency(result.totalPayment) },
          { label: 'Total bunga', value: format.formatCurrency(result.totalInterest) },
          { label: 'Jumlah cicilan', value: format.formatNumber(result.months, 0) + ' bulan' },
          { label: 'Bunga bulan pertama', value: format.formatCurrency(result.firstInterest) },
          { label: 'Pokok bulan pertama', value: format.formatCurrency(result.firstPrincipal) }
        ], 'Simulasi memakai bunga tetap dan cicilan anuitas.');
      } catch (error) {
        ui.errorResult('loan-result', error.message);
      }
    }

    [principalInput, dpInput, rateInput, yearsInput].forEach(function (input) {
      input.addEventListener('input', calculate);
    });

    calculate();
  }

  CalcApp.register({
    id: 'loan',
    name: 'Kalkulator Cicilan & KPR',
    description: 'Simulasikan cicilan bulanan, total bunga, dan total pembayaran pinjaman atau KPR.',
    category: 'Keuangan',
    icon: 'Rp',
    keywords: ['kpr', 'cicilan', 'pinjaman', 'mortgage', 'loan', 'bunga', 'anuitas', 'rumah'],
    compute: compute,
    render: render
  });
})(typeof window !== 'undefined' ? window : globalThis);
