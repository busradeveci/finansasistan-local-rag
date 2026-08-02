import path from "path"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

const BACKEND = "http://127.0.0.1:8000"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiBase = env.VITE_API_BASE ?? ""

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      strictPort: false,
      proxy: apiBase
        ? undefined
        : {
          "/api": { target: BACKEND, changeOrigin: true },
          "/documents": { target: BACKEND, changeOrigin: true },
          "/query": { target: BACKEND, changeOrigin: true },
        },
    },
  }
})
