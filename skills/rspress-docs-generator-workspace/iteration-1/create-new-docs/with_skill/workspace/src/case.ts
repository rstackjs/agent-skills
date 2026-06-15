/**
 * Converts a string to camelCase.
 * @example camelCase('hello world') // 'helloWorld'
 */
export function camelCase(input: string): string {
  return input
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^(.)/, (_, char) => char.toLowerCase());
}

/**
 * Converts a string to kebab-case.
 * @example kebabCase('hello world') // 'hello-world'
 */
export function kebabCase(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Converts a string to snake_case.
 * @example snakeCase('hello world') // 'hello_world'
 */
export function snakeCase(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}
