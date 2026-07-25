import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/reshala_test",
      NEXT_PUBLIC_APP_URL: "https://reshala.test",
      TELEGRAM_BOT_TOKEN: "123456:test-bot-token-for-tests",
      SESSION_SECRET: "test-session-secret-0123456789-0123456789",
    },
  },
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "./src/test/server-only-mock.ts"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
