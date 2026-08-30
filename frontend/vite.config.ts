import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Default Vite binding resolves to IPv6-only ([::1]) on some machines,
    // which leaves http://127.0.0.1:5173 unreachable even though
    // http://localhost:5173 works -- exactly what scripts/demo-preflight.mjs
    // checks. Binding explicitly keeps both reachable everywhere.
    host: true,
  },
})
