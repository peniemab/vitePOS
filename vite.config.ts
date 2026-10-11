/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "vitePOS · Caisse et stock",
        short_name: "vitePOS",
        description: "Caisse, stock, inventaire et clients pour les boutiques de quartier.",
        lang: "fr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#f8f9fb",
        theme_color: "#1a2b4c",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  build: {
    // Le SDK Firebase pèse à lui seul environ 700 ko ; tout est mis en cache pour le hors ligne.
    chunkSizeWarningLimit: 1200,
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
