(function (root) {
  'use strict';

  var CalcApp = root.CalcApp;
  var ui = CalcApp.ui;
  var format = CalcApp.format;

  function categoryFor(bmi) {
    if (bmi < 18.5) return 'Kekurangan berat badan';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Kelebihan berat badan';
    if (bmi < 35) return 'Obesitas kelas I';
    if (bmi < 40) return 'Obesitas kelas II';
    return 'Obesitas kelas III';
  }

  function compute(input) {
    var options = input || {};
    var weight = Number(options.weight);
    var heightCm = Number(options.heightCm);

    if (!isFinite(weight) || weight <= 0) throw new Error('Berat badan harus lebih dari nol.');
    if (!isFinite(heightCm) || heightCm <= 0) throw new Error('Tinggi badan harus lebih dari nol.');

    var height = heightCm / 100;
    var bmi = weight / (height * height);

    return {
      bmi: bmi,
      category: categoryFor(bmi),
      healthyMin: 18.5 * height * height,
      healthyMax: 24.9 * height * height
    };
  }

  function render(container) {
    ui.mount(container,
      '<div class="calc-layout">' +
        '<div class="calc-panel">' +
          ui.fieldGrid(
            ui.inputField({
              id: 'bmi-weight',
              label: 'Berat badan',
              value: '70',
              min: '0',
              step: '0.1',
              suffix: 'kg'
            }),
            ui.inputField({
              id: 'bmi-height',
              label: 'Tinggi badan',
              value: '175',
              min: '0',
              step: '0.1',
              suffix: 'cm'
            })
          ) +
          '<div class="bmi-scale" aria-hidden="true">' +
            '<div class="bmi-track">' +
              '<span class="bmi-segment seg-under"></span>' +
              '<span class="bmi-segment seg-normal"></span>' +
              '<span class="bmi-segment seg-over"></span>' +
              '<span class="bmi-segment seg-obese"></span>' +
              '<span class="bmi-marker" id="bmi-marker"></span>' +
            '</div>' +
            '<div class="bmi-labels">' +
              '<span>15</span><span>18,5</span><span>25</span><span>30</span><span>40</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        ui.resultShell('bmi-result') +
      '</div>'
    );

    var weightInput = container.querySelector('#bmi-weight');
    var heightInput = container.querySelector('#bmi-height');
    var marker = container.querySelector('#bmi-marker');

    function calculate() {
      try {
        var result = compute({
          weight: format.parseNumber(weightInput.value),
          heightCm: format.parseNumber(heightInput.value)
        });
        var position = Math.max(0, Math.min(100, (result.bmi - 15) / 25 * 100));
        marker.style.left = position + '%';

        ui.result('bmi-result', [
          { label: 'Indeks Massa Tubuh', value: format.formatNumber(result.bmi, 2), strong: true },
          { label: 'Kategori', value: result.category },
          { label: 'Rentang berat sehat', value: format.formatNumber(result.healthyMin, 1) + ' – ' + format.formatNumber(result.healthyMax, 1) + ' kg' }
        ], 'Kategori mengikuti standar WHO untuk orang dewasa.');
      } catch (error) {
        marker.style.left = '0%';
        ui.errorResult('bmi-result', error.message);
      }
    }

    [weightInput, heightInput].forEach(function (input) {
      input.addEventListener('input', calculate);
    });

    calculate();
  }

  CalcApp.register({
    id: 'bmi',
    name: 'Kalkulator BMI',
    description: 'Ukur Indeks Massa Tubuh dan lihat kategori berat badan serta rentang berat yang sehat.',
    category: 'Kesehatan',
    icon: 'BMI',
    keywords: ['bmi', 'imt', 'berat badan', 'tinggi badan', 'obesitas', 'kesehatan'],
    compute: compute,
    render: render
  });
})(typeof window !== 'undefined' ? window : globalThis);
