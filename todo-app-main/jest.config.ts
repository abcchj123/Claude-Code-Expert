import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  // 컴포넌트·훅 테스트 기본 환경
  testEnvironment: 'jsdom',
  // API·서비스 테스트는 파일 상단 /** @jest-environment node */ 로 개별 오버라이드

  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  moduleNameMapper: {
    // @/ → src/ 경로 별칭 (next/jest 내부 매퍼보다 먼저 적용)
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  testMatch: [
    '<rootDir>/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.test.{ts,tsx}',
  ],

  // DB 커넥션 등 열린 핸들로 인한 무한 대기 방지
  forceExit: true,
};

export default createJestConfig(config);
