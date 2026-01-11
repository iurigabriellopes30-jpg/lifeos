import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const plugins = [react()];

  if (mode === "production") {
    plugins.push(
      VitePWA({
        base: "/",
        includeAssets: ["favicon.svg"],
        manifest: {
          name: "LifeOS",
          short_name: "LifeOS",
          theme_color: "#ffffff",
          icons: [
            {
              src: "favicon.svg",
              sizes: "192x192",
              type: "image/svg+xml",
            },
          ],
        },
      })
    );
  }

  return {
    plugins,
    build: {
      outDir: "dist",
    },
  };
});