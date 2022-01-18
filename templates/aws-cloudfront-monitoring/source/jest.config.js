module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/templates/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
