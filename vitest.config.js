import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/unit/**/*.spec.js', 'tests/integration/**/*.spec.js'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      // Scope to pure money-math modules. payday.js is a DOM renderer; its
      // allocation formula (payday.js:55-57) is pinned via re-implementation
      // in tests/unit/precision.spec.js and tests/unit/store.properties.spec.js.
      include: ['src/data/store.js', 'src/data/models.js', 'src/utils/helpers.js'],
      exclude: ['src/data/seed.js'],
      reporter: ['text', 'html'],
      thresholds: {
        lines: 85,
        functions: 75,
        branches: 75,
      },
    },
  },
});
