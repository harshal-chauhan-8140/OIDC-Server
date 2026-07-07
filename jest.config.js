import { createDefaultEsmPreset } from 'ts-jest';

/** @type {import("jest").Config} */
export default {
  testEnvironment: 'node',
  // DB-backed suites share a single Postgres database, so run them serially
  // to avoid concurrent schema sync/drop clashes between test files.
  maxWorkers: 1,
  ...createDefaultEsmPreset(),
};
