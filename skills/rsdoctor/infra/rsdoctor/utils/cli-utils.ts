export function requireArg(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

export function parseBoolean(
  value: string | undefined,
  fallback?: boolean
): boolean | undefined {
  if (value === undefined) {
    return fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'y') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'n') {
    return false;
  }
  throw new Error(`Invalid boolean value: ${value}`);
}

export function parseNumber(value: string | undefined, name: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${name}: ${value}`);
  }
  return parsed;
}

export function parsePositiveInt(
  value: string | undefined,
  name: string,
  range: { min?: number; max?: number } = {}
): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error(`Invalid ${name}: ${value}`);
  }
  if (range.min !== undefined && parsed < range.min) {
    throw new Error(`${name} must be >= ${range.min}.`);
  }
  if (range.max !== undefined && parsed > range.max) {
    throw new Error(`${name} must be <= ${range.max}.`);
  }
  return parsed;
}

export function printResult(result: unknown, compact: boolean = false): void {
  if (result === undefined) {
    return;
  }
  const spacing = compact ? 0 : 2;
  console.log(JSON.stringify(result, null, spacing));
}
