import { defineConfig } from 'vitest/config';
import path from 'path';
import { existsSync, readFileSync } from 'fs';

function loadEnv(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=][^=]*)=(.*)$/);
    if (m) {
      const key = m[1]!.trim();
      const value = m[2]!.trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv('.env.test.local');
loadEnv('.env.local');

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    fileParallelism: false,
    include: ['__tests__/**/*.vtest.ts'],
  },
});
