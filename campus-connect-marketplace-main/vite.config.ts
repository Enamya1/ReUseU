import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs"; // 👈 added to read certificate files

export default defineConfig(({ mode }) => ({
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
        target: "http://127.0.0.1:8001",
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
}));
