/**
 * Jest config for repo-root scripts (e.g. kb-context, bench-reconciliation).
 * Workspace-level jest configs cover apps/api and apps/web; this one is
 * scoped to the stand-alone Node scripts in the `scripts/` directory.
 */
const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  // scripts that import from apps/api (e.g. bench-reconciliation) need
  // `@prisma/client` and `@nestjs/*` to resolve. They're installed either
  // in the hoisted root node_modules or in the apps/api workspace, so map
  // common deep imports back to whichever location actually has them.
  moduleDirectories: [
    'node_modules',
    path.resolve(__dirname, '..', 'node_modules'),
    path.resolve(__dirname, '..', 'apps', 'api', 'node_modules'),
    path.resolve(__dirname, '..', 'packages', 'prisma', 'node_modules'),
  ],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        diagnostics: false,
        tsconfig: {
          target: 'ES2022',
          module: 'commonjs',
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          resolveJsonModule: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          // isolatedModules skips the project-wide type check, which would
          // otherwise fail on scripts/bench-reconciliation.ts because
          // `@prisma/client` lives in `apps/api/node_modules` — runtime
          // resolution is handled by `moduleDirectories` above.
          isolatedModules: true,
        },
      },
    ],
  },
};
