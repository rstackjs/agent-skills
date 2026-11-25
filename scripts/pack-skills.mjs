import { copyFile, cp, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const maintainer = process.argv.includes('--maintainer');
const packageDir = join(
  root,
  'npm',
  maintainer ? 'maintainer-skills' : 'skills',
);
const outputDir = join(packageDir, 'skills');

await rm(outputDir, { recursive: true, force: true });

if (maintainer) {
  const { installDir, skills } = JSON.parse(
    await readFile(join(root, 'skills.json'), 'utf8'),
  );
  for (const [name, source] of Object.entries(skills)) {
    if (source === 'local:*') {
      await cp(join(root, installDir, name), join(outputDir, name), {
        recursive: true,
      });
    }
  }
} else {
  await cp(join(root, 'skills'), outputDir, { recursive: true });
}

await copyFile(join(root, 'LICENSE'), join(packageDir, 'LICENSE'));
