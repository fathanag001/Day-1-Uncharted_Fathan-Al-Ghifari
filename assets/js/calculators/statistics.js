(function (root) {
  'use strict';

  var CalcApp = root.CalcApp;
  var ui = CalcApp.ui;
  var format = CalcApp.format;

  function parseValues(text) {
    var tokens = String(text).split(/[\s,;]+/).filter(Boolean);
    if (!tokens.length) throw new Error('Masukkan minimal satu angka.');
    return tokens.map(function (token) {
      var value = Number(token.replace(',', '.'));
      if (!isFinite(value)) throw new Error('Angka tidak valid: ' + token);
      return value;
    });
  }

  function median(sorted) {
    var middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
  }

  function quartiles(sorted) {
    var middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return {
        q1: median(sorted.slice(0, middle)),
        q2: median(sorted),
        q3: median(sorted.slice(middle))
      };
    }
    return {
      q1: median(sorted.slice(0, middle)),
      q2: sorted[middle],
      q3: median(sorted.slice(middle + 1))
    };
  }

  function compute(values) {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('Masukkan minimal satu angka.');
    }

    var data = values.map(function (value, index) {
      var number = Number(value);
      if (!isFinite(number)) throw new Error('Angka ke-' + (index + 1) + ' tidak valid.');
      return number;
    });

    var sorted = data.slice().sort(function (a, b) { return a - b; });
    var count = data.length;
    var sum = data.reduce(function (total, value) { return total + value; }, 0);
    var mean = sum / count;
    var squared = data.reduce(function (total, value) {
      return total + Math.pow(value - mean, 2);
    }, 0);
    var variancePopulation = squared / count;
    var varianceSample = count > 1 ? squared / (count - 1) : 0;

    var counts = new Map();
    sorted.forEach(function (value) {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    var highestCount = 0;
    counts.forEach(function (frequency) {
      if (frequency > highestCount) highestCount = frequency;
    });
    var modes = [];
    if (highestCount > 1) {
      counts.forEach(function (frequency, value) {
        if (frequency === highestCount) modes.push(value);
      });
    }
    modes.sort(function (a, b) { return a - b; });

    var quartile = quartiles(sorted);

    return {
      count: count,
      sum: sum,
      mean: mean,
      median: quartile.q2,
      mode: modes,
      min: sorted[0],
      max: sorted[count - 1],
      range: sorted[count - 1] - sorted[0],
      q1: quartile.q1,
      q3: quartile.q3,
      iqr: quartile.q3 - quartile.q1,
      variancePopulation: variancePopulation,
      varianceSample: varianceSample,
      stdDevPopulation: Math.sqrt(variancePopulation),
      stdDevSample: Math.sqrt(varianceSample)
    };
  }

  function render(container) {
    ui.mount(container,
      '<div class="calc-layout">' +
        '<div class="calc-panel">' +
          ui.textareaField({
            id: 'stat-values',
            label: 'Data angka',
            value: '12, 15, 15, 18, 20, 22, 25',
            rows: 5,
            placeholder: 'Contoh: 12, 15, 15, 18, 20',
            hint: 'Pisahkan angka dengan koma, spasi, atau baris baru.'
          }) +
          '<div class="quick-row">' +
            '<span class="quick-label">Contoh</span>' +
            '<button type="button" class="chip" data-values="12, 15, 15, 18, 20, 22, 25">Data kecil</button>' +
            '<button type="button" class="chip" data-values="70, 72, 75, 78, 80, 82, 85, 88, 90, 95">Nilai ujian</button>' +
            '<button type="button" class="chip" data-values="2, 4, 4, 4, 5, 5, 7, 9">Uji frekuensi</button>' +
          '</div>' +
        '</div>' +
        ui.resultShell('stat-result') +
      '</div>'
    );

    var textarea = container.querySelector('#stat-values');

    function calculate() {
      try {
        var values = parseValues(textarea.value);
        var result = compute(values);
        var modeText = result.mode.length
          ? result.mode.map(function (value) { return format.formatNumber(value, 4); }).join(', ')
          : 'Tidak ada';

        ui.result('stat-result', [
          { label: 'Rata-rata', value: format.formatNumber(result.mean, 4), strong: true },
          { label: 'Median', value: format.formatNumber(result.median, 4) },
          { label: 'Modus', value: modeText },
          { label: 'Jumlah data', value: format.formatNumber(result.count, 0) },
          { label: 'Jumlah nilai', value: format.formatNumber(result.sum, 4) },
          { label: 'Nilai minimum', value: format.formatNumber(result.min, 4) },
          { label: 'Nilai maksimum', value: format.formatNumber(result.max, 4) },
          { label: 'Rentang', value: format.formatNumber(result.range, 4) },
          { label: 'Kuartil 1 (Q1)', value: format.formatNumber(result.q1, 4) },
          { label: 'Kuartil 3 (Q3)', value: format.formatNumber(result.q3, 4) },
          { label: 'Jangkauan interkuartil', value: format.formatNumber(result.iqr, 4) },
          { label: 'Varians populasi', value: format.formatNumber(result.variancePopulation, 6) },
          { label: 'Varians sampel', value: format.formatNumber(result.varianceSample, 6) },
          { label: 'Simpangan baku populasi', value: format.formatNumber(result.stdDevPopulation, 6) },
          { label: 'Simpangan baku sampel', value: format.formatNumber(result.stdDevSample, 6) }
        ], 'Data diurutkan otomatis sebelum dihitung.');
      } catch (error) {
        ui.errorResult('stat-result', error.message);
      }
    }

    textarea.addEventListener('input', calculate);

    container.querySelectorAll('[data-values]').forEach(function (button) {
      button.addEventListener('click', function () {
        textarea.value = button.getAttribute('data-values');
        calculate();
      });
    });

    calculate();
  }

  CalcApp.register({
    id: 'statistics',
    name: 'Kalkulator Statistik',
    description: 'Hitung rata-rata, median, modus, kuartil, varians, dan simpangan baku dari sekumpulan data.',
    category: 'Matematika',
    icon: 'σ',
    keywords: ['statistik', 'statistics', 'rata-rata', 'mean', 'median', 'modus', 'varians', 'standar deviasi'],
    compute: compute,
    parseValues: parseValues,
    render: render
  });
})(typeof window !== 'undefined' ? window : globalThis);
