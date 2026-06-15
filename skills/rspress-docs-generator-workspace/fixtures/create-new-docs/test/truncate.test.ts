import { describe, it, expect } from 'vitest';
import { truncate, ellipsis } from '../src/truncate.js';

describe('truncate', () => {
  it('does not modify short strings', () => {
    expect(truncate('hi', 10)).toBe('hi');
  });

  it('truncates long strings with ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });
});

describe('ellipsis', () => {
  it('does not modify short strings', () => {
    expect(ellipsis('hi', 10)).toBe('hi');
  });

  it('always appends ellipsis when truncated', () => {
    expect(ellipsis('hello world', 8)).toBe('hello...');
  });
});
