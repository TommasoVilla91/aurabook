import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Con `vercel dev` le API /api sono già servite localmente dallo stesso processo,
// quindi il proxy non serve (e causerebbe errori mandando le chiamate al Vercel remoto).
// Con `npm run dev` il proxy è necessario per chiamare le API del deploy remoto.
const isVercelDev = !!process.env.VERCEL;

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: isVercelDev ? undefined : {
      '/api': {
        target: 'https://aurabook-five.vercel.app',
        changeOrigin: true,
      }
    }
  }
})
