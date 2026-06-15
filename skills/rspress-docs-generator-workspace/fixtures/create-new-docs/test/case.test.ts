import { describe, it, expect } from 'vitest';
import { camelCase, kebabCase, snakeCase } from '../src/case.js';

describe('case converters', () => {
  it('camelCase', () => {
    expect(camelCase('hello world')).toBe('helloWorld');
    expect(camelCase('hello-world')).toBe('helloWorld');
    expect(camelCase('hello_world')).toBe('helloWorld');
  });

  it('kebabCase', () => {
    expect(kebabCase('hello world')).toBe('hello-world');
    expect(kebabCase('helloWorld')).toBe('hello-world');
  });

  it('snakeCase', () => {
    expect(snakeCase('hello world')).toBe('hello_world');
    expect(snakeCase('helloWorld')).toBe('hello_world');
  });
});
