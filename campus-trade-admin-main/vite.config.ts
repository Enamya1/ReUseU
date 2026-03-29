import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const apiHost = env.VITE_API_HOST || '10.31.24.202';
  const apiPort = env.VITE_API_PORT || '8000';
  const apiPyPort = env.VITE_API_PY_PORT || '8001';
  
  return {
  server: {
    host: "testadmin.me",
    port: 8080,
    strictPort: false,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/py": {
        target: `http://${apiHost}:${apiPyPort}`,
        changeOrigin: true,
        secure: false,
      },
      "/api": {
        target: `http://${apiHost}:${apiPort}`,
        changeOrigin: true,
        secure: false,
      },
      "/storage": {
        target: `http://${apiHost}:${apiPort}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}});
