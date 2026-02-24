import { defineConfig } from 'tsup';

export default defineConfig([
  // CLI entry — gets shebang
  {
    entry: { cli: 'src/cli.ts' },
    format: ['esm'],
    outExtension: () => ({ js: '.mjs' }),
    target: 'node20',
    dts: false,
    clean: true,
    splitting: false,
    sourcemap: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  // Library entry — no shebang
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    outExtension: () => ({ js: '.mjs' }),
    target: 'node20',
    dts: true,
    clean: false, // Don't wipe cli.mjs
    splitting: false,
    sourcemap: true,
  },
]);
