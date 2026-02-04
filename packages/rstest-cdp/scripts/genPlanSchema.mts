import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { toJsonSchema } from '@valibot/to-json-schema';
import { PlanInputSchema } from '../src/schema.ts';

declare global {
  interface ImportMeta {
    url: string;
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const outDir = path.resolve(__dirname, '../schema');
const outFile = path.join(outDir, 'plan.schema.json');

await mkdir(outDir, { recursive: true });

const schema = toJsonSchema(PlanInputSchema, { target: 'draft-07' });
await writeFile(outFile, `${JSON.stringify(schema, null, 2)}\n`, 'utf8');

process.stderr.write(`Wrote ${outFile}\n`);
