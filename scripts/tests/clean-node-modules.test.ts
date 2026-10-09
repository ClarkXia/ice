import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = fileURLToPath(new URL('../clean-node-modules.cjs', import.meta.url));

describe('setup cleanup', () => {
  it('cleans root and package dependencies without requiring installed tools', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ice-setup-'));
    try {
      fs.mkdirSync(path.join(rootDir, 'scripts'));
      fs.copyFileSync(scriptPath, path.join(rootDir, 'scripts/clean-node-modules.cjs'));
      for (const directory of ['node_modules', 'packages/example/node_modules']) {
        const target = path.join(rootDir, directory);
        fs.mkdirSync(target, { recursive: true });
        fs.writeFileSync(path.join(target, 'dependency.txt'), 'fixture');
      }
      fs.writeFileSync(path.join(rootDir, 'packages/example/source.ts'), 'export {};');
      fs.writeFileSync(path.join(rootDir, 'packages/README.md'), 'keep');

      // Run from a different working directory and repeat after dependencies are gone.
      for (let attempt = 0; attempt < 2; attempt++) {
        execFileSync(process.execPath, [path.join(rootDir, 'scripts/clean-node-modules.cjs')], {
          cwd: os.tmpdir(),
        });
      }
      expect(fs.existsSync(path.join(rootDir, 'node_modules'))).toBe(false);
      expect(fs.existsSync(path.join(rootDir, 'packages/example/node_modules'))).toBe(false);
      expect(fs.readFileSync(path.join(rootDir, 'packages/example/source.ts'), 'utf8')).toBe('export {};');
      expect(fs.readFileSync(path.join(rootDir, 'packages/README.md'), 'utf8')).toBe('keep');
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('succeeds when neither dependencies nor the packages directory exists', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ice-setup-empty-'));
    try {
      fs.mkdirSync(path.join(rootDir, 'scripts'));
      fs.copyFileSync(scriptPath, path.join(rootDir, 'scripts/clean-node-modules.cjs'));
      execFileSync(process.execPath, [path.join(rootDir, 'scripts/clean-node-modules.cjs')]);
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });
});
