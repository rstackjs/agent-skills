import {
  formatPercent as formatFromPackageRoot,
  sum as sumFromPackage,
} from '@fixture/math-kit';
import { formatPercent as formatFromPackageSubpath } from '@fixture/math-kit/format';
import {
  formatPercent as formatFromDistRoot,
  sum as sumFromDist,
} from '../dist/index.js';
import { formatPercent as formatFromDistSubpath } from '../dist/format.js';

if (sumFromPackage([1, 2, 3]) !== 6 || sumFromDist([1, 2, 3]) !== 6) {
  throw new Error('Unexpected package or dist sum result');
}

if (
  formatFromPackageRoot(0.25) !== '25%' ||
  formatFromPackageSubpath(0.5) !== '50%' ||
  formatFromDistRoot(0.25) !== '25%' ||
  formatFromDistSubpath(0.5) !== '50%'
) {
  throw new Error('Unexpected package or dist formatPercent result');
}
