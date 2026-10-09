import path from 'path';
import { runInNewContext } from 'vm';
import { describe, expect, it } from 'vitest';
import compilationPlugin from '../src/unPlugins/compilation';
import compileExcludes from '../src/compileExcludes';

const createPlugin = () => compilationPlugin({
  rootDir: process.cwd(),
  mode: 'production',
  fastRefresh: false,
  compileIncludes: [/node_modules[/\\\\]animejs[/\\\\]/],
  compileExcludes,
  enableEnv: false,
  swcOptions: {
    compilationConfig: { jsc: { target: 'es5' } },
  },
});

describe('compileDependencies with CommonJS files', () => {
  it('includes selected dependencies for npm and pnpm paths', () => {
    const plugin = createPlugin();
    for (const id of [
      '/app/node_modules/animejs/dist/modules/index.cjs',
      '/app/node_modules/.pnpm/animejs@4.0.0/node_modules/animejs/dist/modules/index.cjs',
    ]) {
      expect(plugin.transformInclude!(id)).toBe(true);
    }
  });

  it('preserves supported extensions and dependency exclusions', () => {
    const plugin = createPlugin();
    for (const extension of ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs']) {
      expect(plugin.transformInclude!(`/app/node_modules/animejs/index.${extension}`)).toBe(true);
    }
    expect(plugin.transformInclude!('/app/node_modules/other/index.cjs')).toBe(false);
    expect(plugin.transformInclude!('/app/node_modules/animejs/index.css')).toBe(false);
  });

  it('lowers optional chaining and preserves CommonJS exports', async () => {
    const plugin = createPlugin();
    const id = path.join(process.cwd(), 'node_modules/animejs/index.cjs');
    expect(plugin.transformInclude!(id)).toBe(true);
    const source = 'const item = { value: 42 }; module.exports = [item?.value, null?.value];';
    const result = await (plugin.transform as Function).call({
      error(error: unknown) { throw error; },
    }, source, id);
    expect(result.code).not.toContain('?.');
    const context = { module: { exports: undefined } };
    runInNewContext(result.code, context);
    expect(Array.from(context.module.exports as unknown as unknown[])).toEqual([42, undefined]);
  });
});
