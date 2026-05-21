import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "clover"],
      reportsDirectory: "./coverage",
      include: ["src/lib/**/*.{ts,tsx}", "src/store/**/*.ts"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/**/types/**",
        // Export / intégrations lourdes (peu de valeur en unitaire)
        "src/lib/**/*.csv.ts",
        "src/lib/**/*.pdf.ts",
        "src/lib/prediction.tsx",
        "src/lib/inventaire.export.ts",
        // Clients GraphQL / fetch (testés via *.api.test ou E2E, pas dans le % lignes)
        "src/lib/**/*.api.ts",
        // Glue Next.js server-only
        "src/lib/getServerAccessToken.ts",
        "src/lib/requireServerAccessToken.ts",
      ],
      thresholds: {
        lines: 45,
        statements: 45,
        branches: 40,
        functions: 40,
      },
    },
    reporters: [
      "default",
      ["vitest-sonar-reporter", { outputFile: "sonar-report.xml" }],
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
