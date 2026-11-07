(function (root) {
  'use strict';

  var CalcApp = root.CalcApp;
  var ui = CalcApp.ui;
  var format = CalcApp.format;

  var gradePoints = {
    'A': 4,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2,
    'C-': 1.7,
    'D': 1,
    'E': 0,
    'F': 0
  };

  var gradeOptions = Object.keys(gradePoints);

  function compute(courses) {
    if (!Array.isArray(courses) || courses.length === 0) {
      throw new Error('Tambahkan minimal satu mata kuliah.');
    }

    var totalCredits = 0;
    var totalPoints = 0;

    courses.forEach(function (course, index) {
      var grade = String(course.grade || '').toUpperCase();
      var credits = Number(course.credits);

      if (!(grade in gradePoints)) {
        throw new Error('Grade baris ' + (index + 1) + ' tidak dikenal.');
      }
      if (!isFinite(credits) || credits <= 0 || !Number.isInteger(credits)) {
        throw new Error('SKS baris ' + (index + 1) + ' harus bilangan bulat lebih dari nol.');
      }

      totalCredits += credits;
      totalPoints += gradePoints[grade] * credits;
    });

    return {
      gpa: totalPoints / totalCredits,
      totalCredits: totalCredits,
      totalPoints: totalPoints,
      courseCount: courses.length
    };
  }

  function predicateFor(gpa) {
    if (gpa >= 3.5) return 'Sangat baik';
    if (gpa >= 3) return 'Baik';
    if (gpa >= 2.5) return 'Cukup';
    return 'Perlu perbaikan';
  }

  function rowHtml(grade, credits) {
    var options = gradeOptions.map(function (value) {
      return '<option value="' + value + '"' + (value === grade ? ' selected' : '') + '>' + value + '</option>';
    }).join('');

    return '<div class="gpa-row">' +
      '<input class="gpa-name" type="text" placeholder="Mata kuliah (opsional)" autocomplete="off">' +
      '<select class="gpa-grade" aria-label="Grade">' + options + '</select>' +
      '<input class="gpa-credits" type="number" min="1" step="1" value="' + (credits || 3) + '" aria-label="SKS">' +
      '<button type="button" class="row-remove" aria-label="Hapus mata kuliah">×</button>' +
    '</div>';
  }

  function render(container) {
    ui.mount(container,
      '<div class="calc-layout">' +
        '<div class="calc-panel">' +
          '<div class="gpa-head">' +
            '<span>Mata kuliah</span>' +
            '<span>Grade</span>' +
            '<span>SKS</span>' +
            '<span></span>' +
          '</div>' +
          '<div id="gpa-rows" class="gpa-rows">' +
            rowHtml('A', 3) +
            rowHtml('B+', 3) +
            rowHtml('B', 3) +
          '</div>' +
          '<button type="button" class="add-row-btn" id="gpa-add">Tambah mata kuliah</button>' +
        '</div>' +
        ui.resultShell('gpa-result') +
      '</div>'
    );

    var rowsContainer = container.querySelector('#gpa-rows');
    var addButton = container.querySelector('#gpa-add');

    function calculate() {
      var rows = Array.prototype.slice.call(rowsContainer.querySelectorAll('.gpa-row'));
      var courses = [];

      rows.forEach(function (row) {
        var grade = row.querySelector('.gpa-grade').value;
        var credits = format.parseNumber(row.querySelector('.gpa-credits').value);
        if (!isFinite(credits)) return;
        courses.push({ grade: grade, credits: credits });
      });

      try {
        var result = compute(courses);
        ui.result('gpa-result', [
          { label: 'IPK', value: format.formatNumber(result.gpa, 3), strong: true },
          { label: 'Predikat', value: predicateFor(result.gpa) },
          { label: 'Total SKS', value: format.formatNumber(result.totalCredits, 0) },
          { label: 'Total mutu', value: format.formatNumber(result.totalPoints, 2) },
          { label: 'Jumlah mata kuliah', value: format.formatNumber(result.courseCount, 0) }
        ], 'Skala 4.0 dengan bobot SKS.');
      } catch (error) {
        ui.errorResult('gpa-result', error.message);
      }
    }

    rowsContainer.addEventListener('input', calculate);
    rowsContainer.addEventListener('change', calculate);
    rowsContainer.addEventListener('click', function (event) {
      var removeButton = event.target.closest('.row-remove');
      if (!removeButton) return;
      if (rowsContainer.querySelectorAll('.gpa-row').length <= 1) {
        ui.errorResult('gpa-result', 'Minimal harus ada satu mata kuliah.');
        return;
      }
      removeButton.closest('.gpa-row').remove();
      calculate();
    });

    addButton.addEventListener('click', function () {
      rowsContainer.insertAdjacentHTML('beforeend', rowHtml('A', 3));
      calculate();
    });

    calculate();
  }

  CalcApp.register({
    id: 'gpa',
    name: 'Kalkulator IPK / GPA',
    description: 'Hitung IPK berbobot SKS dengan skala 4.0 dan lihat predikat akademiknya.',
    category: 'Lainnya',
    icon: 'A+',
    keywords: ['ipk', 'gpa', 'grade', 'sks', 'kampus', 'kuliah', 'nilai'],
    compute: compute,
    render: render
  });
})(typeof window !== 'undefined' ? window : globalThis);
