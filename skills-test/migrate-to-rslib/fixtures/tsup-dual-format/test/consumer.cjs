const { clamp, formatCurrency } = require('../dist/index.cjs');

if (clamp(-2, 0, 10) !== 0) {
  throw new Error('Unexpected CommonJS clamp result');
}

if (formatCurrency(8, 'EUR') !== '€8.00') {
  throw new Error('Unexpected CommonJS currency result');
}
