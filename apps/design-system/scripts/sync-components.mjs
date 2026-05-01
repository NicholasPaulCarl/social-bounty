import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(__dirname, '../../web/src/styles/design-system/components.jsx');
const outputPath = path.resolve(__dirname, '../src/components.generated.tsx');

const source = await fs.readFile(sourcePath, 'utf8');

const exportMatch = source.match(
  /\/\* Export to window for cross-script access \*\/[\s\S]*?Object\.assign\(window,\s*{([\s\S]*?)}\);\s*$/,
);

if (!exportMatch) {
  throw new Error('Could not locate the window export block in components.jsx');
}

const moduleBody = source
  .replace(/^\/\* @jsxRuntime classic \*\/\n\/\* @jsxFrag React\.Fragment \*\/\n?/, '')
  .replace(
    /\/\* Export to window for cross-script access \*\/[\s\S]*?Object\.assign\(window,\s*{([\s\S]*?)}\);\s*$/,
    `export {${exportMatch[1]}\n};\n`,
  );

const output = [
  '// @ts-nocheck',
  '// This file is generated from apps/web/src/styles/design-system/components.jsx.',
  "// Run `npm run sync:components --workspace=apps/design-system` after editing the canonical wrapper layer.",
  "import React from 'react';",
  '',
  moduleBody.trimEnd(),
  '',
].join('\n');

await fs.writeFile(outputPath, output);
