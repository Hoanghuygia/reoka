import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import zaloMiniApp from "zmp-vite-plugin";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default () => {
  return defineConfig({
    root: "./src",
    base: "",
    // Root is ./src here but "." in `npm run build`, so use an absolute path
    // to mini-app-reoka/.env. Only VITE_* variables reach the app.
    envDir: fileURLToPath(new URL(".", import.meta.url)),
    plugins: [zaloMiniApp(), react()],
    build: {
      assetsInlineLimit: 0,
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  });
};
