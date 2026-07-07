import { createDefaultEsmPreset } from 'ts-jest';

/** @type {import("jest").Config} */
export default {
  testEnvironment: 'node',
  ...createDefaultEsmPreset(),
  // NodeNext requires ".js" extensions in TS imports (e.g. "./config/logger.js"),
  // but the real files are ".ts". Strip the extension so Jest resolves the source.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
