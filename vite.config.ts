import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  base: "/axolotl-2/",
  plugins: [react(), tailwindcss()],
  build: { manifest: true, rollupOptions: { input: { app: "app.html", responsiveLab: "header-responsive-lab.html" } } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    environmentOptions: {
      jsdom: { url: "https://iriskax.github.io/axolotl-2/" },
    },
  },
});
