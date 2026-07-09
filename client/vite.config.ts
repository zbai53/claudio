import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true, // 端口被占就报错,不要悄悄换 5174
    proxy: {
      // 前端调 /api/* 时,Vite 把请求转发给后端的 3000
      // 这样前端代码里写 fetch('/api/health') 就行,不用写完整 URL
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/stream': {
        target: 'ws://127.0.0.1:3000',
        ws: true,
      },
    },
  },
});
