(function (root) {
  'use strict';

  var CalcApp = root.CalcApp;
  var ui = CalcApp.ui;
  var format = CalcApp.format;

  function tokenize(input) {
    var text = String(input)
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/π/g, 'pi')
      .replace(/,/g, '.');
    var tokens = [];
    var index = 0;

    while (index < text.length) {
      var char = text[index];

      if (/\s/.test(char)) {
        index += 1;
        continue;
      }

      if (/[0-9.]/.test(char)) {
        var start = index;
        while (index < text.length && /[0-9.]/.test(text[index])) index += 1;
        var numberText = text.slice(start, index);
        var number = Number(numberText);
        if (!isFinite(number) || numberText === '.') {
          throw new Error('Angka tidak valid: ' + numberText);
        }
        tokens.push({ type: 'number', value: number });
        continue;
      }

      if (/[a-zA-Z]/.test(char)) {
        var nameStart = index;
        while (index < text.length && /[a-zA-Z]/.test(text[index])) index += 1;
        tokens.push({ type: 'name', value: text.slice(nameStart, index).toLowerCase() });
        continue;
      }

      if ('+-*/^(),'.indexOf(char) !== -1) {
        tokens.push({ type: char });
        index += 1;
        continue;
      }

      throw new Error('Karakter tidak dikenal: ' + char);
    }

    return tokens;
  }

  function evaluate(expression, angleMode) {
    var mode = angleMode === 'rad' ? 'rad' : 'deg';
    var tokens = tokenize(expression);
    var position = 0;

    function toRadians(value) {
      return mode === 'rad' ? value : value * Math.PI / 180;
    }

    function fromRadians(value) {
      return mode === 'rad' ? value : value * 180 / Math.PI;
    }

    var functions = {
      sin: function (value) { return Math.sin(toRadians(value)); },
      cos: function (value) { return Math.cos(toRadians(value)); },
      tan: function (value) { return Math.tan(toRadians(value)); },
      asin: function (value) { return fromRadians(Math.asin(value)); },
      acos: function (value) { return fromRadians(Math.acos(value)); },
      atan: function (value) { return fromRadians(Math.atan(value)); },
      log: function (value) { return Math.log10(value); },
      ln: function (value) { return Math.log(value); },
      sqrt: function (value) { return Math.sqrt(value); },
      abs: function (value) { return Math.abs(value); },
      exp: function (value) { return Math.exp(value); }
    };

    function peek() {
      return tokens[position];
    }

    function take(type) {
      var token = tokens[position];
      if (!token || token.type !== type) {
        throw new Error('Ekspresi tidak lengkap atau tidak valid.');
      }
      position += 1;
      return token;
    }

    function parseExpression() {
      var value = parseTerm();
      while (peek() && (peek().type === '+' || peek().type === '-')) {
        var operator = tokens[position].type;
        position += 1;
        var rhs = parseTerm();
        value = operator === '+' ? value + rhs : value - rhs;
      }
      return value;
    }

    function parseTerm() {
      var value = parseUnary();
      while (peek() && (peek().type === '*' || peek().type === '/')) {
        var operator = tokens[position].type;
        position += 1;
        var rhs = parseUnary();
        if (operator === '/' && rhs === 0) {
          throw new Error('Tidak bisa membagi dengan nol.');
        }
        value = operator === '*' ? value * rhs : value / rhs;
      }
      return value;
    }

    function parseUnary() {
      if (peek() && (peek().type === '-' || peek().type === '+')) {
        var operator = tokens[position].type;
        position += 1;
        var value = parseUnary();
        return operator === '-' ? -value : value;
      }
      return parsePower();
    }

    function parsePower() {
      var base = parsePrimary();
      if (peek() && peek().type === '^') {
        position += 1;
        return Math.pow(base, parseUnary());
      }
      return base;
    }

    function parsePrimary() {
      var token = peek();
      if (!token) throw new Error('Ekspresi tidak lengkap.');

      if (token.type === 'number') {
        position += 1;
        return token.value;
      }

      if (token.type === '(') {
        position += 1;
        var grouped = parseExpression();
        take(')');
        return grouped;
      }

      if (token.type === 'name') {
        position += 1;
        if (token.value === 'pi') return Math.PI;
        if (token.value === 'e') return Math.E;
        var fn = functions[token.value];
        if (!fn) throw new Error('Fungsi tidak dikenal: ' + token.value);
        take('(');
        var argument = parseExpression();
        take(')');
        return fn(argument);
      }

      throw new Error('Ekspresi tidak valid.');
    }

    var result = parseExpression();
    if (position < tokens.length) {
      throw new Error('Ada bagian ekspresi yang tidak terbaca.');
    }
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Hasil tidak terdefinisi.');
    }
    return result;
  }

  function balanceParentheses(expression) {
    var open = 0;
    for (var i = 0; i < expression.length; i += 1) {
      if (expression[i] === '(') open += 1;
      if (expression[i] === ')') open -= 1;
    }
    return expression + new Array(Math.max(0, open) + 1).join(')');
  }

  function compute(input) {
    var options = typeof input === 'string' ? { expression: input } : (input || {});
    var expression = options.expression;
    var angleMode = options.angleMode || 'deg';
    if (!expression || !String(expression).trim()) {
      throw new Error('Masukkan ekspresi terlebih dahulu.');
    }
    return {
      value: evaluate(String(expression), angleMode),
      angleMode: angleMode
    };
  }

  function render(container) {
    var keys = [
      { label: 'C', action: 'clear', tone: 'muted' },
      { label: '(', insert: '(', tone: 'muted' },
      { label: ')', insert: ')', tone: 'muted' },
      { label: '÷', insert: '/', tone: 'operator' },
      { label: '7', insert: '7' },
      { label: '8', insert: '8' },
      { label: '9', insert: '9' },
      { label: '×', insert: '*', tone: 'operator' },
      { label: '4', insert: '4' },
      { label: '5', insert: '5' },
      { label: '6', insert: '6' },
      { label: '−', insert: '-', tone: 'operator' },
      { label: '1', insert: '1' },
      { label: '2', insert: '2' },
      { label: '3', insert: '3' },
      { label: '+', insert: '+', tone: 'operator' },
      { label: '0', insert: '0' },
      { label: '.', insert: '.' },
      { label: '⌫', action: 'backspace', tone: 'muted' },
      { label: '=', action: 'equals', tone: 'accent' }
    ];

    var scientificKeys = [
      { label: 'sin', insert: 'sin(' },
      { label: 'cos', insert: 'cos(' },
      { label: 'tan', insert: 'tan(' },
      { label: '^', insert: '^', tone: 'operator' },
      { label: 'log', insert: 'log(' },
      { label: 'ln', insert: 'ln(' },
      { label: '√', insert: 'sqrt(' },
      { label: 'π', insert: 'pi', tone: 'operator' },
      { label: 'e', insert: 'e' },
      { label: 'abs', insert: 'abs(' },
      { label: 'exp', insert: 'exp(' },
      { label: 'x²', insert: '^2', tone: 'operator' }
    ];

    function keyButton(key) {
      var className = 'sci-key' + (key.tone ? ' is-' + key.tone : '');
      var attrs = [
        'type="button"',
        'class="' + className + '"'
      ];
      if (key.insert !== undefined) attrs.push('data-insert="' + ui.escapeHtml(key.insert) + '"');
      if (key.action) attrs.push('data-action="' + key.action + '"');
      attrs.push('data-scientific="' + (key.scientific ? 'true' : 'false') + '"');
      return '<button ' + attrs.join(' ') + '>' + ui.escapeHtml(key.label) + '</button>';
    }

    ui.mount(container,
      '<div class="calc-layout">' +
        '<div class="calc-panel">' +
          '<div class="sci-display">' +
            '<label class="visually-hidden" for="sci-expression">Ekspresi matematika</label>' +
            '<input id="sci-expression" class="sci-expression" type="text" inputmode="text" autocomplete="off" spellcheck="false" placeholder="Contoh: 2 * (3 + 4) ^ 2">' +
            '<select id="sci-angle" class="sci-angle" aria-label="Satuan sudut">' +
              '<option value="deg">DEG</option>' +
              '<option value="rad">RAD</option>' +
            '</select>' +
          '</div>' +
          '<div class="mode-switch" role="group" aria-label="Mode kalkulator">' +
            '<button type="button" class="mode-btn is-active" data-mode="scientific">Ilmiah</button>' +
            '<button type="button" class="mode-btn" data-mode="basic">Dasar</button>' +
          '</div>' +
          '<div class="sci-keypad" id="sci-basic-keys">' +
            keys.map(function (key) { return keyButton(key); }).join('') +
          '</div>' +
          '<div class="sci-keypad sci-keypad-advanced" id="sci-advanced-keys">' +
            scientificKeys.map(function (key) { return keyButton(key); }).join('') +
          '</div>' +
        '</div>' +
        ui.resultShell('sci-result') +
      '</div>'
    );

    var expressionInput = container.querySelector('#sci-expression');
    var angleSelect = container.querySelector('#sci-angle');
    var advancedKeys = container.querySelector('#sci-advanced-keys');

    function run(strict) {
      var expression = expressionInput.value.trim();
      if (!expression) {
        ui.clearResult('sci-result');
        return;
      }

      var prepared = balanceParentheses(expression);
      try {
        var value = evaluate(prepared, angleSelect.value);
        ui.result('sci-result', [
          { label: 'Hasil', value: format.formatNumber(value, 10), strong: true },
          { label: 'Ekspresi', value: ui.escapeHtml(expression), wide: true }
        ], 'Mode sudut: ' + angleSelect.value.toUpperCase());
      } catch (error) {
        if (strict) {
          ui.errorResult('sci-result', error.message);
        } else {
          ui.clearResult('sci-result');
        }
      }
    }

    function insert(text) {
      expressionInput.value += text;
      expressionInput.focus();
      run(false);
    }

    container.querySelectorAll('[data-insert]').forEach(function (button) {
      button.addEventListener('click', function () {
        insert(button.getAttribute('data-insert'));
      });
    });

    container.querySelectorAll('[data-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        var action = button.getAttribute('data-action');
        if (action === 'clear') {
          expressionInput.value = '';
          ui.clearResult('sci-result');
        } else if (action === 'backspace') {
          expressionInput.value = expressionInput.value.slice(0, -1);
          run(false);
        } else if (action === 'equals') {
          run(true);
        }
        expressionInput.focus();
      });
    });

    container.querySelectorAll('.mode-btn').forEach(function (button) {
      button.addEventListener('click', function () {
        container.querySelectorAll('.mode-btn').forEach(function (item) {
          item.classList.toggle('is-active', item === button);
        });
        advancedKeys.hidden = button.getAttribute('data-mode') === 'basic';
      });
    });

    expressionInput.addEventListener('input', function () { run(false); });
    expressionInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        run(true);
      }
    });
    angleSelect.addEventListener('change', function () { run(false); });

    expressionInput.focus();
  }

  CalcApp.register({
    id: 'scientific',
    name: 'Kalkulator Ilmiah',
    description: 'Hitung ekspresi matematika lengkap dengan fungsi trigonometri, logaritma, dan pangkat.',
    category: 'Matematika',
    icon: '√',
    keywords: ['scientific', 'ilmiah', 'basic', 'dasar', 'trigonometri', 'sin', 'cos', 'log', 'pangkat'],
    compute: compute,
    evaluate: evaluate,
    render: render
  });
})(typeof window !== 'undefined' ? window : globalThis);
