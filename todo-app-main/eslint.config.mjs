import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/server/*', '../server/*', '../../server/*'],
              message: 'src/client 에서 src/server 직접 import 금지 — API Route 경유',
            },
          ],
        },
      ],
    },
    files: ['src/client/**/*.{ts,tsx}'],
  },
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/client/*', '../client/*', '../../client/*'],
              message: 'src/server 에서 src/client 직접 import 금지',
            },
          ],
        },
      ],
    },
    files: ['src/server/**/*.{ts,tsx}'],
  },
];

export default eslintConfig;
