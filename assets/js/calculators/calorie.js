(function (root) {
  'use strict';

  var CalcApp = root.CalcApp;
  var ui = CalcApp.ui;
  var format = CalcApp.format;

  var activityLevels = {
    '1.2': 'Jarang bergerak',
    '1.375': 'Aktivitas ringan',
    '1.55': 'Aktivitas sedang',
    '1.725': 'Aktivitas berat',
    '1.9': 'Sangat berat'
  };

  function compute(input) {
    var options = input || {};
    var weight = Number(options.weight);
    var heightCm = Number(options.heightCm);
    var age = Number(options.age);
    var sex = options.sex === 'female' ? 'female' : 'male';
    var activity = Number(options.activity === undefined ? 1.55 : options.activity);

    if (!isFinite(weight) || weight <= 0) throw new Error('Berat badan harus lebih dari nol.');
    if (!isFinite(heightCm) || heightCm <= 0) throw new Error('Tinggi badan harus lebih dari nol.');
    if (!isFinite(age) || age <= 0) throw new Error('Usia harus lebih dari nol.');
    if (!isFinite(activity) || activity <= 0) throw new Error('Tingkat aktivitas tidak valid.');

    var base = 10 * weight + 6.25 * heightCm - 5 * age;
    var bmr = sex === 'male' ? base + 5 : base - 161;
    var tdee = bmr * activity;

    return {
      bmr: bmr,
      tdee: tdee,
      lose: tdee - 500,
      gain: tdee + 500,
      sex: sex,
      activity: activity
    };
  }

  function render(container) {
    ui.mount(container,
      '<div class="calc-layout">' +
        '<div class="calc-panel">' +
          ui.fieldGrid(
            ui.selectField({
              id: 'calorie-sex',
              label: 'Jenis kelamin',
              value: 'male',
              options: [
                { value: 'male', label: 'Laki-laki' },
                { value: 'female', label: 'Perempuan' }
              ]
            }),
            ui.inputField({
              id: 'calorie-age',
              label: 'Usia',
              value: '30',
              min: '1',
              step: '1',
              suffix: 'tahun'
            }),
            ui.inputField({
              id: 'calorie-weight',
              label: 'Berat badan',
              value: '70',
              min: '0',
              step: '0.1',
              suffix: 'kg'
            }),
            ui.inputField({
              id: 'calorie-height',
              label: 'Tinggi badan',
              value: '175',
              min: '0',
              step: '0.1',
              suffix: 'cm'
            }),
            ui.selectField({
              id: 'calorie-activity',
              label: 'Tingkat aktivitas',
              value: '1.55',
              options: Object.keys(activityLevels).map(function (value) {
                return { value: value, label: activityLevels[value] + ' (' + value + '×)' };
              })
            })
          ) +
        '</div>' +
        ui.resultShell('calorie-result') +
      '</div>'
    );

    var sexSelect = container.querySelector('#calorie-sex');
    var ageInput = container.querySelector('#calorie-age');
    var weightInput = container.querySelector('#calorie-weight');
    var heightInput = container.querySelector('#calorie-height');
    var activitySelect = container.querySelector('#calorie-activity');

    function calculate() {
      try {
        var result = compute({
          sex: sexSelect.value,
          age: format.parseNumber(ageInput.value),
          weight: format.parseNumber(weightInput.value),
          heightCm: format.parseNumber(heightInput.value),
          activity: format.parseNumber(activitySelect.value)
        });

        ui.result('calorie-result', [
          { label: 'Kebutuhan kalori harian (TDEE)', value: format.formatNumber(result.tdee, 0) + ' kkal', strong: true },
          { label: 'Metabolisme basal (BMR)', value: format.formatNumber(result.bmr, 0) + ' kkal' },
          { label: 'Target turun berat', value: format.formatNumber(result.lose, 0) + ' kkal' },
          { label: 'Target naik berat', value: format.formatNumber(result.gain, 0) + ' kkal' }
        ], 'Perkiraan memakai rumus Mifflin-St Jeor. Target turun/naik memakai selisih 500 kkal per hari.');
      } catch (error) {
        ui.errorResult('calorie-result', error.message);
      }
    }

    [sexSelect, ageInput, weightInput, heightInput, activitySelect].forEach(function (input) {
      input.addEventListener('input', calculate);
      input.addEventListener('change', calculate);
    });

    calculate();
  }

  CalcApp.register({
    id: 'calorie',
    name: 'Kalkulator Kalori (BMR/TDEE)',
    description: 'Hitung kebutuhan kalori harian dengan rumus Mifflin-St Jeor dan target berat badan.',
    category: 'Kesehatan',
    icon: 'kal',
    keywords: ['kalori', 'calorie', 'bmr', 'tdee', 'diet', 'mifflin', 'kesehatan'],
    compute: compute,
    render: render
  });
})(typeof window !== 'undefined' ? window : globalThis);
