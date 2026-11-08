import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const resolvedApiUrl =
    env.VITE_API_URL || "https://teacher-world.onrender.com/api"

  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(resolvedApiUrl),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "https://teacher-world.onrender.com",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
