/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { documentosApiPlugin } from "./vite/documentosApi";

export default defineConfig({
  plugins: [react(), tailwindcss(), documentosApiPlugin()],
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    alias: {
      "sonner@2.0.3": "sonner",
      "lucide-react@0.487.0": "lucide-react",
      "class-variance-authority@0.7.1": "class-variance-authority",
      "@radix-ui/react-tabs@1.1.3": "@radix-ui/react-tabs",
      "@radix-ui/react-slot@1.1.2": "@radix-ui/react-slot",
      "@radix-ui/react-label@2.1.2": "@radix-ui/react-label",
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    outDir: "dist",
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
