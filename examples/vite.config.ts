import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import { rsxTypeStripPlugin, rsxVitePlugin } from "../src/vite.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  root: __dirname,
  publicDir: "",

  resolve: {
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".rsx"],
  },
  plugins: [
    // Plugin order matters:
    // 1. Strip TypeScript from .rsx files (enforce: "pre")
    // 2. Transform RSX → React
    // 3. Transform JSX → JS (React plugin)
    rsxTypeStripPlugin(),
    rsxVitePlugin(),
    react({
      include: /\.(jsx|tsx)$/,
    }),
  ],
});
