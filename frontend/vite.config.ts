import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const apiTarget = process.env.VITE_API_URL || "http://localhost:8899";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5899,
    proxy: {
      "/run": { target: apiTarget, changeOrigin: true },
      "/runs": { target: apiTarget, changeOrigin: true },
      "/health": { target: apiTarget, changeOrigin: true },
      "/sessions": { target: apiTarget, changeOrigin: true },
      "/skills": { target: apiTarget, changeOrigin: true },
      "/swarm/presets": { target: apiTarget, changeOrigin: true },
      "/swarm/runs": { target: apiTarget, changeOrigin: true },
      "/settings/llm": { target: apiTarget, changeOrigin: true },
      "/settings/data-sources": { target: apiTarget, changeOrigin: true },
      "/correlation": { target: apiTarget, changeOrigin: true },
      "/upload": { target: apiTarget, changeOrigin: true },
      "/api": { target: apiTarget, changeOrigin: true },
      "/system": { target: apiTarget, changeOrigin: true },
      "/shadow-reports": { target: apiTarget, changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": ["echarts"],
        },
      },
    },
  },
});
