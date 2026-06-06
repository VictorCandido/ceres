import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/generated/**",
        "src/**/*.test.{ts,tsx}",
        "src/components/ui/**",
        "src/app/layout.tsx",
        "src/app/**/page.tsx",    // Next.js pages precisam de testes de integração
        "src/proxy.ts",           // middleware de auth não é unit-testável
        "src/lib/db.ts",          // singleton do Prisma sem lógica
        "src/lib/auth.ts",        // wrapper iron-session sem lógica de domínio
        "src/__mocks__/**",       // arquivos de mock não contam como código
      ],
      thresholds: {
        branches: 65,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },
})
