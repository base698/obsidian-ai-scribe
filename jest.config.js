module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/*-test.ts'],
  testEnvironment: 'jsdom',
  collectCoverage: true,
  collectCoverageFrom: ['**/*.ts', 'main.ts', '!main.js','!**/*.d.ts', '!**/node_modules/**'],
};
