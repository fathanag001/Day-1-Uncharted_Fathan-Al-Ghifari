'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const sandbox = { console };
sandbox.window = sandbox;
vm.createContext(sandbox);

function load(relativePath) {
  const filename = path.join(projectRoot, relativePath);
  vm.runInContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
}

[
  'assets/js/core/registry.js',
  'assets/js/core/format.js',
  'assets/js/core/ui.js'
].forEach(load);

const calculatorDir = path.join(projectRoot, 'assets/js/calculators');
fs.readdirSync(calculatorDir)
  .filter((file) => file.endsWith('.js'))
  .sort()
  .forEach((file) => load(path.join('assets/js/calculators', file)));

const CalcApp = sandbox.CalcApp;
const calc = (id) => CalcApp.registry.get(id);
const closeTo = (actual, expected, epsilon = 1e-9) => {
  assert.ok(
    Math.abs(actual - expected) < epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`
  );
};

test('registry contains every calculator and supports search', () => {
  const ids = Array.from(CalcApp.registry.all(), (item) => item.id).sort();
  assert.deepEqual(ids, [
    'age',
    'bmi',
    'calorie',
    'compound',
    'discount',
    'fraction',
    'gpa',
    'loan',
    'percentage',
    'scientific',
    'statistics',
    'tip',
    'unit-converter'
  ]);

  CalcApp.registry.all().forEach((item) => {
    assert.equal(typeof item.name, 'string');
    assert.equal(typeof item.description, 'string');
    assert.equal(typeof item.compute, 'function');
    assert.equal(typeof item.render, 'function');
  });

  assert.equal(CalcApp.registry.search('bmi')[0].id, 'bmi');
  assert.equal(CalcApp.registry.search('kalori')[0].id, 'calorie');
  assert.equal(CalcApp.registry.search('keuangan').length, 4);
  assert.equal(CalcApp.registry.get('tidak-ada'), null);
});

test('format helpers use Indonesian number formatting', () => {
  const format = CalcApp.format;
  assert.equal(format.formatNumber(1234567.891, 2), '1.234.567,89');
  assert.equal(format.formatCurrency(1234567.89), 'Rp 1.234.568');
  assert.equal(format.parseNumber('1.234,56'), 1234.56);
  assert.equal(format.parseNumber('1,5'), 1.5);
  assert.equal(format.parseNumber('1.234'), 1234);
  assert.equal(format.parseNumber('  42 '), 42);
  assert.ok(Number.isNaN(format.parseNumber('')));
});

test('scientific calculator evaluates expressions and functions', () => {
  const evaluate = calc('scientific').evaluate;

  assert.equal(evaluate('2 + 3 * 4', 'deg'), 14);
  assert.equal(evaluate('(2 + 3) * 4', 'deg'), 20);
  assert.equal(evaluate('2 * (3 + 4) ^ 2', 'deg'), 98);
  assert.equal(evaluate('2 ^ 3 ^ 2', 'deg'), 512);
  assert.equal(evaluate('-2 ^ 2', 'deg'), -4);
  assert.equal(evaluate('(-2) ^ 2', 'deg'), 4);
  closeTo(evaluate('sin(30)', 'deg'), 0.5, 1e-12);
  closeTo(evaluate('sin(pi / 2)', 'rad'), 1, 1e-12);
  closeTo(evaluate('cos(60)', 'deg'), 0.5, 1e-12);
  closeTo(evaluate('log(100)', 'deg'), 2, 1e-12);
  closeTo(evaluate('ln(e)', 'deg'), 1, 1e-12);
  closeTo(evaluate('sqrt(81)', 'deg'), 9, 1e-12);
  assert.equal(calc('scientific').compute({ expression: '10 / 4' }).value, 2.5);
  assert.throws(() => evaluate('1 / 0', 'deg'), /membagi dengan nol/i);
  assert.throws(() => evaluate('sin(30', 'deg'), /tidak lengkap/i);
  assert.throws(() => evaluate('2 +', 'deg'), /tidak lengkap/i);
});

test('percentage calculator handles all modes', () => {
  const percentage = calc('percentage');

  assert.equal(percentage.compute({ mode: 'of', a: 15, b: 200000 }).value, 30000);
  assert.equal(percentage.compute({ mode: 'what', a: 30, b: 200 }).value, 15);
  assert.equal(percentage.compute({ mode: 'change', a: 200, b: 250 }).value, 25);
  closeTo(percentage.compute({ mode: 'increase', a: 200000, b: 10 }).value, 220000);
  closeTo(percentage.compute({ mode: 'decrease', a: 200000, b: 25 }).value, 150000);
  assert.equal(percentage.percentOf(15, 200), 30);
  assert.equal(percentage.whatPercent(30, 200), 15);
  assert.equal(percentage.percentChange(200, 250), 25);
  assert.throws(() => percentage.whatPercent(10, 0), /tidak boleh nol/i);
  assert.throws(() => percentage.percentChange(0, 10), /tidak boleh nol/i);
});

test('fraction calculator simplifies and converts', () => {
  const fraction = calc('fraction');

  const added = fraction.compute({ operation: 'add', numerator1: 1, denominator1: 2, numerator2: 1, denominator2: 3 });
  assert.deepEqual([added.numerator, added.denominator], [5, 6]);
  assert.equal(added.decimal, 5 / 6);

  const subtracted = fraction.compute({ operation: 'subtract', numerator1: 3, denominator1: 4, numerator2: 1, denominator2: 4 });
  assert.deepEqual([subtracted.numerator, subtracted.denominator], [1, 2]);

  const multiplied = fraction.compute({ operation: 'multiply', numerator1: 2, denominator1: 3, numerator2: 3, denominator2: 5 });
  assert.deepEqual([multiplied.numerator, multiplied.denominator], [2, 5]);

  const divided = fraction.compute({ operation: 'divide', numerator1: 1, denominator1: 2, numerator2: 3, denominator2: 4 });
  assert.deepEqual([divided.numerator, divided.denominator], [2, 3]);

  const mixed = fraction.compute({ operation: 'add', numerator1: 7, denominator1: 4, numerator2: 0, denominator2: 1 });
  assert.equal(mixed.mixed, '1 3/4');
  assert.equal(mixed.decimal, 1.75);

  const simplified = fraction.simplify(2, 4);
  assert.equal(simplified.numerator, 1);
  assert.equal(simplified.denominator, 2);
  assert.throws(() => fraction.compute({ operation: 'add', numerator1: 1, denominator1: 0, numerator2: 1, denominator2: 2 }), /tidak boleh nol/i);
  assert.throws(() => fraction.compute({ operation: 'divide', numerator1: 1, denominator1: 2, numerator2: 0, denominator2: 3 }), /nol/i);
  assert.throws(() => fraction.compute({ operation: 'add', numerator1: 1.5, denominator1: 2, numerator2: 1, denominator2: 2 }), /bilangan bulat/i);
});

test('statistics calculator computes descriptive statistics', () => {
  const statistics = calc('statistics');
  const result = statistics.compute([2, 4, 4, 4, 5, 5, 7, 9]);

  assert.equal(result.count, 8);
  assert.equal(result.sum, 40);
  assert.equal(result.mean, 5);
  assert.equal(result.median, 4.5);
  assert.deepEqual(Array.from(result.mode), [4]);
  assert.equal(result.min, 2);
  assert.equal(result.max, 9);
  assert.equal(result.range, 7);
  assert.equal(result.q1, 4);
  assert.equal(result.q3, 6);
  assert.equal(result.iqr, 2);
  assert.equal(result.variancePopulation, 4);
  closeTo(result.varianceSample, 32 / 7, 1e-12);
  assert.equal(result.stdDevPopulation, 2);
  closeTo(result.stdDevSample, Math.sqrt(32 / 7), 1e-12);

  assert.deepEqual(Array.from(statistics.parseValues('1, 2 3;4\n5')), [1, 2, 3, 4, 5]);
  assert.throws(() => statistics.compute([]), /minimal satu angka/i);
  assert.throws(() => statistics.parseValues('1, abc'), /tidak valid/i);
  assert.equal(statistics.compute([7]).varianceSample, 0);
});

test('loan calculator uses the annuity formula', () => {
  const loan = calc('loan');

  const zeroInterest = loan.compute({
    principal: 120000000,
    downPayment: 0,
    annualRate: 0,
    years: 1
  });
  assert.equal(zeroInterest.loanAmount, 120000000);
  assert.equal(zeroInterest.months, 12);
  assert.equal(zeroInterest.monthlyPayment, 10000000);
  assert.equal(zeroInterest.totalPayment, 120000000);
  assert.equal(zeroInterest.totalInterest, 0);

  const mortgage = loan.compute({
    principal: 600000000,
    downPayment: 120000000,
    annualRate: 8,
    years: 10
  });
  assert.equal(mortgage.loanAmount, 480000000);
  assert.equal(mortgage.months, 120);
  closeTo(mortgage.monthlyPayment, 5823724.529057172, 1e-6);
  closeTo(mortgage.totalInterest, 218846943.48686063, 1e-4);
  closeTo(mortgage.firstInterest, 3200000, 1e-9);
  closeTo(mortgage.firstPrincipal, 2623724.529057172, 1e-6);

  assert.throws(() => loan.compute({ principal: 100, downPayment: 100, annualRate: 5, years: 1 }), /lebih kecil/i);
  assert.throws(() => loan.compute({ principal: 100, annualRate: -1, years: 1 }), /tidak boleh negatif/i);
});

test('compound interest calculator handles frequencies', () => {
  const compound = calc('compound');

  const annual = compound.compute({ principal: 1000, annualRate: 10, years: 2, compoundsPerYear: 1 });
  closeTo(annual.finalAmount, 1210, 1e-9);
  closeTo(annual.interest, 210, 1e-9);
  closeTo(annual.effectiveRate, 10, 1e-9);

  const monthly = compound.compute({ principal: 1000, annualRate: 10, years: 2, compoundsPerYear: 12 });
  closeTo(monthly.finalAmount, 1220.3909613755593, 1e-9);

  const continuous = compound.compute({ principal: 1000, annualRate: 10, years: 2, compoundsPerYear: 'continuous' });
  closeTo(continuous.finalAmount, 1221.40275816017, 1e-9);

  assert.throws(() => compound.compute({ principal: 0, annualRate: 10, years: 2 }), /lebih dari nol/i);
  assert.throws(() => compound.compute({ principal: 1000, annualRate: 10, years: 0 }), /lebih dari nol/i);
});

test('tip and split calculator divides the total correctly', () => {
  const tip = calc('tip').compute({ bill: 200000, tipPercent: 20, taxPercent: 10, people: 4 });

  assert.equal(tip.tax, 20000);
  assert.equal(tip.tip, 40000);
  assert.equal(tip.total, 260000);
  assert.equal(tip.perPerson, 65000);
  assert.equal(tip.tipPerPerson, 10000);
  assert.throws(() => calc('tip').compute({ bill: 100000, tipPercent: 10, people: 0 }), /minimal satu/i);
  assert.throws(() => calc('tip').compute({ bill: 100000, tipPercent: 10, people: 1.5 }), /minimal satu/i);
});

test('discount calculator applies discount before tax', () => {
  const discount = calc('discount').compute({ price: 500000, discountPercent: 20, taxPercent: 10 });

  assert.equal(discount.discount, 100000);
  assert.equal(discount.afterDiscount, 400000);
  assert.equal(discount.tax, 40000);
  assert.equal(discount.finalPrice, 440000);
  assert.equal(discount.savings, 100000);

  assert.throws(() => calc('discount').compute({ price: 1000, discountPercent: 101 }), /0 dan 100/i);
});

test('BMI calculator classifies adults and gives a healthy range', () => {
  const bmi = calc('bmi');

  const normal = bmi.compute({ weight: 70, heightCm: 175 });
  closeTo(normal.bmi, 22.857142857142858, 1e-12);
  assert.equal(normal.category, 'Normal');
  closeTo(normal.healthyMin, 56.65625, 1e-12);
  closeTo(normal.healthyMax, 76.25625, 1e-12);

  assert.equal(bmi.compute({ weight: 50, heightCm: 175 }).category, 'Kekurangan berat badan');
  assert.equal(bmi.compute({ weight: 90, heightCm: 175 }).category, 'Kelebihan berat badan');
  assert.equal(bmi.compute({ weight: 100, heightCm: 175 }).category, 'Obesitas kelas I');
  assert.throws(() => bmi.compute({ weight: 0, heightCm: 175 }), /lebih dari nol/i);
});

test('calorie calculator uses Mifflin-St Jeor and activity multipliers', () => {
  const calorie = calc('calorie');

  const male = calorie.compute({ weight: 70, heightCm: 175, age: 30, sex: 'male', activity: 1.55 });
  assert.equal(male.bmr, 1648.75);
  closeTo(male.tdee, 2555.5625, 1e-9);
  closeTo(male.lose, 2055.5625, 1e-9);
  closeTo(male.gain, 3055.5625, 1e-9);

  const female = calorie.compute({ weight: 70, heightCm: 175, age: 30, sex: 'female', activity: 1.55 });
  assert.equal(female.bmr, 1482.75);
  closeTo(female.tdee, 2298.2625, 1e-9);

  assert.throws(() => calorie.compute({ weight: 70, heightCm: 175, age: 0 }), /lebih dari nol/i);
});

test('unit converter handles length, mass, temperature, time, and data', () => {
  const converter = calc('unit-converter');

  assert.equal(converter.convert('length', 'km', 'm', 1), 1000);
  assert.equal(converter.convert('length', 'm', 'cm', 1), 100);
  closeTo(converter.convert('mass', 'kg', 'lb', 1), 2.2046226218487757, 1e-12);
  assert.equal(converter.convert('temperature', 'c', 'f', 100), 212);
  assert.equal(converter.convert('temperature', 'f', 'c', 32), 0);
  assert.equal(converter.convert('temperature', 'c', 'k', 0), 273.15);
  assert.equal(converter.convert('temperature', 'k', 'c', 273.15), 0);
  assert.equal(converter.convert('time', 'hour', 'second', 1), 3600);
  assert.equal(converter.convert('time', 'day', 'hour', 1), 24);
  assert.equal(converter.convert('data', 'gb', 'mb', 1), 1024);
  assert.equal(converter.compute({ category: 'length', from: 'km', to: 'm', value: 2 }).result, 2000);
  assert.equal(converter.compute({ category: 'length', from: 'km', to: 'm', value: 2 }).categoryLabel, 'Panjang');
  assert.throws(() => converter.convert('panjang', 'km', 'm', 1), /tidak dikenal/i);
});

test('age calculator handles calendar differences and next birthday', () => {
  const age = calc('age');

  const oneYear = age.compute({ birthDate: '2000-01-01', referenceDate: '2001-01-01' });
  assert.equal(oneYear.years, 1);
  assert.equal(oneYear.months, 0);
  assert.equal(oneYear.days, 0);
  assert.equal(oneYear.totalDays, 366);
  assert.equal(oneYear.totalMonths, 12);
  assert.equal(oneYear.nextBirthdayDays, 0);

  const adult = age.compute({ birthDate: '2000-01-15', referenceDate: '2026-11-07' });
  assert.equal(adult.years, 26);
  assert.equal(adult.months, 9);
  assert.equal(adult.days, 23);
  assert.equal(adult.totalDays, 9793);
  assert.equal(adult.totalMonths, 321);
  assert.equal(adult.nextBirthdayDays, 69);

  assert.throws(() => age.compute({ birthDate: '2026-11-08', referenceDate: '2026-11-07' }), /tidak boleh setelah/i);
  assert.throws(() => age.compute({ birthDate: '2000-02-30', referenceDate: '2026-11-07' }), /tidak valid/i);
});

test('GPA calculator weights grades by credits', () => {
  const gpa = calc('gpa');
  const result = gpa.compute([
    { grade: 'A', credits: 3 },
    { grade: 'B+', credits: 2 },
    { grade: 'A-', credits: 4 }
  ]);

  closeTo(result.gpa, 33.4 / 9, 1e-12);
  assert.equal(result.totalCredits, 9);
  closeTo(result.totalPoints, 33.4, 1e-12);
  assert.equal(result.courseCount, 3);

  const withF = gpa.compute([{ grade: 'A', credits: 3 }, { grade: 'F', credits: 3 }]);
  assert.equal(withF.gpa, 2);

  assert.throws(() => gpa.compute([]), /minimal satu/i);
  assert.throws(() => gpa.compute([{ grade: 'Z', credits: 3 }]), /tidak dikenal/i);
  assert.throws(() => gpa.compute([{ grade: 'A', credits: 0 }]), /lebih dari nol/i);
});
