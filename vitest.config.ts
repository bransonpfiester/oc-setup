import { defineConfig } from "vitest/config";
import path from "path";

const webModules = path.resolve(__dirname, "web/node_modules");

export default defineConfig({
  test: {
    globals: true,
    root: ".",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
    },
    mockReset: true,
    restoreMocks: true,
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "web/src") },
      { find: /^next($|\/.*)/, replacement: path.join(webModules, "next$1") },
      { find: /^zod$/, replacement: path.join(webModules, "zod") },
    ],
  },
});
