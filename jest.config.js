import { createDefaultEsmPreset } from 'ts-jest';

/** @type {import("jest").Config} */
export default {
  testEnvironment: 'node',
  ...createDefaultEsmPreset(),
};
