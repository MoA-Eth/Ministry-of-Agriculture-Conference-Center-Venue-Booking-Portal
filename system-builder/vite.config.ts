import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Target modern browsers for smaller output
    target: "es2020",
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Increase chunk size warning limit (some vendor libs are large)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual vendor chunk splitting for optimal caching
        manualChunks(id: string) {
          // React core — changes rarely, cache long-term
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          // Router — separate chunk for navigation
          if (id.includes("node_modules/react-router")) {
            return "vendor-router";
          }
          // Radix UI components — only loaded when UI primitives are needed
          if (id.includes("node_modules/@radix-ui")) {
            return "vendor-radix";
          }
          // Charting lib (recharts) — very large, only needed in Dashboard
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "vendor-charts";
          }
          // Date utilities
          if (id.includes("node_modules/date-fns") || id.includes("node_modules/ethiopian-calendar")) {
            return "vendor-dates";
          }
          // Icons — loaded on demand
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
          // React Query
          if (id.includes("node_modules/@tanstack")) {
            return "vendor-query";
          }
        },
      },
    },
  },
}));
