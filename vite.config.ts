import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    port: 4173
  },
  test: {
    environment: "node",
    coverage: {
      reporter: ["text", "html"]
    }
  }
});
