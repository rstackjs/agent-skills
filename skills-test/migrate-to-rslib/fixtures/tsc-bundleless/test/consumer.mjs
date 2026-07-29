import { formatPercent as formatFromRoot, sum } from '../dist/index.js';
import { formatPercent } from '../dist/format.js';

if (sum([1, 2, 3]) !== 6) {
  throw new Error('Unexpected sum result');
}

if (formatFromRoot(0.25) !== '25%' || formatPercent(0.5) !== '50%') {
  throw new Error('Unexpected formatPercent result');
}
