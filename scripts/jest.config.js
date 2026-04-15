/**
 * Jest config for repo-root scripts (e.g. kb-context).
 * Workspace-level jest configs cover apps/api and apps/web; this one is
 * scoped to the stand-alone Node scripts in the `scripts/` directory.
 */
/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'commonjs',
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          resolveJsonModule: true,
        },
      },
    ],
  },
};
