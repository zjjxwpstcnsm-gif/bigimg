import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ base: '/bigimg/', plugins: [react()], worker: { format: 'es' }, build: { chunkSizeWarningLimit: 1800 }, test: { include: ['tests/**/*.test.ts'] } } as Parameters<typeof defineConfig>[0])
