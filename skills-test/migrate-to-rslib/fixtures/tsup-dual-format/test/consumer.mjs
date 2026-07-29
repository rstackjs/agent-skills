import { clamp, formatCurrency } from '../dist/index.js';

if (clamp(12, 0, 10) !== 10) {
  throw new Error('Unexpected ESM clamp result');
}

if (formatCurrency(12.5) !== '$12.50') {
  throw new Error('Unexpected ESM currency result');
}
