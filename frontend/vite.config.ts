import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const apiTarget = process.env.VITE_API_URL || "http://localhost:8899";
const apiPrefix = process.env.VITE_BROWSER_API_PREFIX || "/vibe-trading";
const apiPrefixPattern = new RegExp(`^${apiPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);

function proxyApi() {
  return {
    target: apiTarget,
    changeOrigin: true,
    rewrite: (p: string) => p.replace(apiPrefixPattern, ""),
  };
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5899,
    proxy: {
      [`${apiPrefix}/run`]: proxyApi(),
      [`${apiPrefix}/runs`]: proxyApi(),
      [`${apiPrefix}/health`]: proxyApi(),
      [`${apiPrefix}/sessions`]: proxyApi(),
      [`${apiPrefix}/skills`]: proxyApi(),
      [`${apiPrefix}/swarm/presets`]: proxyApi(),
      [`${apiPrefix}/swarm/runs`]: proxyApi(),
      [`${apiPrefix}/settings/llm`]: proxyApi(),
      [`${apiPrefix}/settings/data-sources`]: proxyApi(),
      [`${apiPrefix}/correlation`]: proxyApi(),
      [`${apiPrefix}/upload`]: proxyApi(),
      [`${apiPrefix}/api`]: proxyApi(),
      [`${apiPrefix}/system`]: proxyApi(),
      [`${apiPrefix}/shadow-reports`]: proxyApi(),
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
