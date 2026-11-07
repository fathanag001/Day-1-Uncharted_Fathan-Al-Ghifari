(function (root) {
  'use strict';

  var CalcApp = root.CalcApp;
  var ui = CalcApp.ui;
  var format = CalcApp.format;

  function parseDateOnly(value) {
    if (value instanceof Date) {
      if (isNaN(value.getTime())) throw new Error('Tanggal tidak valid.');
      return {
        year: value.getFullYear(),
        month: value.getMonth() + 1,
        day: value.getDate()
      };
    }

    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
    if (!match) throw new Error('Format tanggal harus YYYY-MM-DD.');

    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      throw new Error('Tanggal tidak valid.');
    }

    return { year: year, month: month, day: day };
  }

  function todayParts() {
    var now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate()
    };
  }

  function toUtc(parts) {
    return Date.UTC(parts.year, parts.month - 1, parts.day);
  }

  function compute(input) {
    var options = input || {};
    var birth = parseDateOnly(options.birthDate);
    var reference = options.referenceDate ? parseDateOnly(options.referenceDate) : todayParts();

    if (toUtc(birth) > toUtc(reference)) {
      throw new Error('Tanggal lahir tidak boleh setelah tanggal acuan.');
    }

    var years = reference.year - birth.year;
    var months = reference.month - birth.month;
    var days = reference.day - birth.day;

    if (days < 0) {
      months -= 1;
      days += new Date(reference.year, reference.month - 1, 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    var totalDays = Math.round((toUtc(reference) - toUtc(birth)) / 86400000);
    var todayUtc = toUtc(reference);
    var nextBirthdayUtc = Date.UTC(reference.year, birth.month - 1, birth.day);
    if (nextBirthdayUtc < todayUtc) {
      nextBirthdayUtc = Date.UTC(reference.year + 1, birth.month - 1, birth.day);
    }

    return {
      years: years,
      months: months,
      days: days,
      totalMonths: years * 12 + months,
      totalDays: totalDays,
      totalWeeks: Math.floor(totalDays / 7),
      remainingDays: totalDays % 7,
      nextBirthday: new Date(nextBirthdayUtc),
      nextBirthdayDays: Math.round((nextBirthdayUtc - todayUtc) / 86400000)
    };
  }

  function isoToday() {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    return now.getFullYear() + '-' + month + '-' + day;
  }

  function render(container) {
    ui.mount(container,
      '<div class="calc-layout">' +
        '<div class="calc-panel">' +
          ui.fieldGrid(
            ui.inputField({
              id: 'age-birth',
              label: 'Tanggal lahir',
              type: 'date',
              value: '2000-01-01'
            }),
            ui.inputField({
              id: 'age-reference',
              label: 'Hitung per tanggal',
              type: 'date',
              value: isoToday()
            })
          ) +
          '<div class="quick-row">' +
            '<span class="quick-label">Acuan</span>' +
            '<button type="button" class="chip" id="age-today">Hari ini</button>' +
            '<button type="button" class="chip" id="age-new-year">Awal tahun depan</button>' +
          '</div>' +
        '</div>' +
        ui.resultShell('age-result') +
      '</div>'
    );

    var birthInput = container.querySelector('#age-birth');
    var referenceInput = container.querySelector('#age-reference');

    function calculate() {
      try {
        var result = compute({
          birthDate: birthInput.value,
          referenceDate: referenceInput.value
        });
        var ageText = result.years + ' tahun ' + result.months + ' bulan ' + result.days + ' hari';
        var nextText = result.nextBirthdayDays === 0
          ? 'Hari ini'
          : result.nextBirthdayDays + ' hari lagi';

        ui.result('age-result', [
          { label: 'Usia', value: ageText, strong: true },
          { label: 'Total hari', value: format.formatNumber(result.totalDays, 0) + ' hari' },
          { label: 'Total minggu', value: format.formatNumber(result.totalWeeks, 0) + ' minggu ' + result.remainingDays + ' hari' },
          { label: 'Total bulan', value: format.formatNumber(result.totalMonths, 0) + ' bulan' },
          { label: 'Ulang tahun berikutnya', value: format.formatDate(result.nextBirthday) + ' (' + nextText + ')' }
        ], 'Perhitungan memakai kalender Gregorian dan mengabaikan jam.');
      } catch (error) {
        ui.errorResult('age-result', error.message);
      }
    }

    [birthInput, referenceInput].forEach(function (input) {
      input.addEventListener('input', calculate);
      input.addEventListener('change', calculate);
    });

    container.querySelector('#age-today').addEventListener('click', function () {
      referenceInput.value = isoToday();
      calculate();
    });

    container.querySelector('#age-new-year').addEventListener('click', function () {
      var now = new Date();
      referenceInput.value = (now.getFullYear() + 1) + '-01-01';
      calculate();
    });

    calculate();
  }

  CalcApp.register({
    id: 'age',
    name: 'Kalkulator Usia',
    description: 'Hitung usia dalam tahun, bulan, hari, dan lihat hitungan mundur ke ulang tahun berikutnya.',
    category: 'Lainnya',
    icon: 'thn',
    keywords: ['usia', 'umur', 'age', 'tanggal lahir', 'ulang tahun'],
    compute: compute,
    render: render
  });
})(typeof window !== 'undefined' ? window : globalThis);
