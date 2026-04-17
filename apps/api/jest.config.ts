import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@social-bounty/shared$': '<rootDir>/../../packages/shared/src/index',
    '^@social-bounty/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    // uuid v13 ships ESM-only; map to its CJS-compatible internal path for Jest
    '^uuid$': '<rootDir>/test/uuid-shim.js',
  },
};

export default config;
