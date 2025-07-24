module.exports = {
  preset: "ts-jest",

  testEnvironment: "node",

  roots: ["<rootDir>/src", "<rootDir>/tests"],

  testMatch: [
    "**/__tests__/**/*.ts", // Files in __tests__ folders
    "**/?(*.)+(spec|test).ts", // Files ending with .spec.ts or .test.ts
  ],

  transform: {
    "^.+\\.ts$": "ts-jest",
  },

  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts", // Exclude type definitions
    "!src/server.ts", // Exclude main server file
    "!src/types/**", // Exclude type files
  ],

  coverageDirectory: "coverage",

  coverageReporters: [
    "text", // Console output
    "html", // HTML report
    "lcov", // For CI/CD integration
  ],

  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

  testTimeout: 30000,

  verbose: true,

  clearMocks: true,

  resetMocks: true,

  restoreMocks: true,
}
