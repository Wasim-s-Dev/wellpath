import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-only-secret-with-at-least-32-characters",
    },
    hookTimeout: 180_000,
    testTimeout: 20_000,
  },
});
