/**
 * Truncates a string to a maximum length, appending an ellipsis if truncated.
 * @example truncate('hello world', 5) // 'hello...'
 */
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength) + '...';
}

/**
 * Truncates a string and always appends an ellipsis if it exceeds maxLength.
 * Reserves three characters for the ellipsis.
 * @example ellipsis('hello world', 8) // 'hello...'
 */
export function ellipsis(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return input.slice(0, Math.max(0, maxLength - 3)) + '...';
}
