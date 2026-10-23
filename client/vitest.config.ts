import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.tsx', 'src/**/*.test.ts', 'tests/**/*.test.tsx'],
    passWithNoTests: true,
  },
});
