import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// 앱의 vite.config.ts(Cloudflare/vinext 플러그인)를 끌어오지 않도록 별도 설정을 둔다.
// lib/nepsa.ts는 의존성이 없는 순수 모듈이라 node 환경만으로 충분하다.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
});
