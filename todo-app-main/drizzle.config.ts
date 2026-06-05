import { defineConfig } from 'drizzle-kit';
import { existsSync, readFileSync } from 'fs';

// drizzle-kit은 .env.local을 자동 로드하지 않으므로 직접 파싱
if (existsSync('.env.local')) {
  const lines = readFileSync('.env.local', 'utf-8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^#=][^=]*)=(.*)$/);
    if (match) {
      const key = match[1]!.trim();
      const value = match[2]!.trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

export default defineConfig({
  dialect: 'postgresql',
  schema: 'src/server/db/schema.ts',
  out: 'drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
