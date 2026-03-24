import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs"; // 👈 added to read certificate files

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Get API host from env or use default
  const apiHost = env.VITE_API_HOST || '10.29.14.209';
  const apiPort = env.VITE_API_PORT || '8000';
  const apiPyPort = env.VITE_API_PY_PORT || '8001';
  
  return {
  server: {
    host: "testuser.me",          // your custom domain
    port: 8080,
    strictPort: false,            // optional – allows fallback if port is busy
    https: {                       // 👈 HTTPS configuration
      key: fs.readFileSync("./testuser.me+2-key.pem"),
      cert: fs.readFileSync("./testuser.me+2.pem"),
    },
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
