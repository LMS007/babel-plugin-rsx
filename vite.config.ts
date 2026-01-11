import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
//
//import { createRequire } from "module";
import { transform as esbuildTransform } from "esbuild";
import type { Plugin } from "vite";
//const require = createRequire(import.meta.url);

function rsxImportAnalysisPlugin(): Plugin {
  return {
    name: "vite-rsx-import-analysis",
    enforce: "pre",

    async transform(code, id) {
      if (!id.endsWith(".rsx")) return null;

      const result = await esbuildTransform(code, {
        loader: "jsx",
        jsx: "automatic",
        sourcemap: true,
        sourcefile: id,
      });

      return {
        code: result.code,
        map: result.map || null,
      };
    },
  };
}
//

// https://vite.dev/config/
export default defineConfig({
  
  resolve: {
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".rsx"],
    alias: {
      "react-raw": "/src/raw/react-raw.ts"
    }
  },
  plugins: [
    rsxImportAnalysisPlugin(),
    react({
      include: /\.(jsx|tsx|rsx)$/,
      babel: {
        plugins: [
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require("./src/raw/babel-plugin-react-raw-rsx.cjs"),
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "https://data-bass.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
