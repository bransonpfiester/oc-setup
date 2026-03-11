import { expect } from "vitest";

interface CustomMatchers<R = unknown> {
  toBeValidExecResult(): R;
  toContainAllKeys(keys: string[]): R;
  toBeNonEmptyString(): R;
  toBeBetween(min: number, max: number): R;
  toMatchMarkdownStructure(headings: string[]): R;
}

declare module "vitest" {
  interface Assertion<T> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
  toBeValidExecResult(received: unknown) {
    const obj = received as Record<string, unknown>;
    const pass =
      obj !== null &&
      typeof obj === "object" &&
      typeof obj.stdout === "string" &&
      typeof obj.stderr === "string" &&
      typeof obj.exitCode === "number";

    return {
      pass,
      message: () =>
        pass
          ? `expected value not to be a valid ExecResult`
          : `expected value to be a valid ExecResult with stdout (string), stderr (string), exitCode (number), got ${JSON.stringify(received)}`,
    };
  },

  toContainAllKeys(received: unknown, keys: string[]) {
    const obj = received as Record<string, unknown>;
    const missingKeys = keys.filter((key) => !(key in obj));
    const pass = missingKeys.length === 0;

    return {
      pass,
      message: () =>
        pass
          ? `expected object not to contain all keys ${keys.join(", ")}`
          : `expected object to contain keys: ${missingKeys.join(", ")}`,
    };
  },

  toBeNonEmptyString(received: unknown) {
    const pass = typeof received === "string" && received.length > 0;

    return {
      pass,
      message: () =>
        pass
          ? `expected value not to be a non-empty string`
          : `expected a non-empty string, got ${JSON.stringify(received)}`,
    };
  },

  toBeBetween(received: unknown, min: number, max: number) {
    const num = received as number;
    const pass = typeof num === "number" && num >= min && num <= max;

    return {
      pass,
      message: () =>
        pass
          ? `expected ${num} not to be between ${min} and ${max}`
          : `expected ${num} to be between ${min} and ${max}`,
    };
  },

  toMatchMarkdownStructure(received: unknown, headings: string[]) {
    const str = received as string;
    const missingHeadings = headings.filter(
      (h) => !str.includes(`# ${h}`) && !str.includes(`## ${h}`),
    );
    const pass = missingHeadings.length === 0;

    return {
      pass,
      message: () =>
        pass
          ? `expected markdown not to contain headings ${headings.join(", ")}`
          : `expected markdown to contain headings: ${missingHeadings.join(", ")}`,
    };
  },
});
