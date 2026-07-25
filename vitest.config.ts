import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/reshala_test",
      NEXT_PUBLIC_APP_URL: "https://reshala.test",
    },
  },
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "./src/test/server-only-mock.ts"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
