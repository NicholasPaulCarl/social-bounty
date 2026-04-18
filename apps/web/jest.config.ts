import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testRegex: '.*\\.test\\.ts$',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
        // ts-jest internally forces moduleResolution=node10, which TypeScript 5.9+
        // flags as deprecated (TS5107). Suppress it here so we can set the value
        // the error message asks for ("6.0") only when TS 6 is installed.
        diagnostics: { ignoreCodes: [5107] },
      },
    ],
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@social-bounty/shared$': '<rootDir>/../../packages/shared/src/index',
    '^@social-bounty/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
