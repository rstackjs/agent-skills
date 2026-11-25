import { existsSync } from 'node:fs';
import { copyFile, cp, readdir, rm } from 'node:fs/promises';
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
  const skillsDir = join(root, '.agents/skills');
  for (const entry of await readdir(skillsDir, { withFileTypes: true })) {
    // Dependency skills linked by pnpm are not repo-owned maintainer skills.
    if (
      entry.isDirectory() &&
      existsSync(join(skillsDir, entry.name, 'SKILL.md'))
    ) {
      await cp(join(skillsDir, entry.name), join(outputDir, entry.name), {
        recursive: true,
      });
    }
  }
} else {
  await cp(join(root, 'skills'), outputDir, { recursive: true });
}

await copyFile(join(root, 'LICENSE'), join(packageDir, 'LICENSE'));
