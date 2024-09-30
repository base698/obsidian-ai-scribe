module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/*-test.ts'],
  testEnvironment: 'jsdom',
  collectCoverage: true,
  collectCoverageFrom: ['**/*.{ts,ts}', '!main.js','!**/*.d.ts', '!**/node_modules/**'],
};
