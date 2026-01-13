import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const plugins = [react()];

  return {
    plugins,
    build: {
      outDir: "dist",
    },
  };
});