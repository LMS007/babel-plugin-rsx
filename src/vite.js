import { transformSync } from "@babel/core";
import { createFilter } from "@rollup/pluginutils";
import { transform as esbuildTransform } from "esbuild";
import rsxBabelPlugin from "./index.cjs";

/**
 * Strips TypeScript syntax from .rsx files using esbuild.
 * Runs as enforce: "pre" to ensure TS is erased before RSX transformation.
 * 
 * - Preserves JSX (jsx: "preserve")
 * - Targets ESNext to avoid downleveling
 * - Maintains sourcemaps for proper error mapping
 */
export function rsxTypeStripPlugin(options = {}) {
  const filter = createFilter(options.include || /\.rsx$/, options.exclude);

  return {
    name: "vite-plugin-rsx-typestrip",
    enforce: "pre",

    async transform(code, id) {
      if (!filter(id)) return null;

      // Use esbuild to strip TypeScript while preserving JSX
      const result = await esbuildTransform(code, {
        loader: "tsx",
        jsx: "preserve",
        target: "esnext",
        sourcemap: true,
        sourcefile: id,
      });

      return {
        code: result.code,
        map: result.map,
      };
    },
  };
}

/**
 * Main RSX Vite plugin that transforms RSX components to React.
 * Expects plain JavaScript + JSX input (TypeScript should be stripped first).
 * 
 * Plugin order when using TypeScript in .rsx files:
 * 1. rsxTypeStripPlugin (enforce: "pre") - strips TS syntax
 * 2. rsxVitePlugin (no enforce) - RSX → React transformation
 * 3. @vitejs/plugin-react - JSX → JS transformation
 */
export function rsxVitePlugin(options = {}) {
  const filter = createFilter(options.include || /\.rsx$/, options.exclude);

  return {
    name: "vite-plugin-rsx",
    // No enforce - runs after "pre" plugins but before React plugin

    // Configure HMR to do full reload for RSX files
    handleHotUpdate({ file, server }) {
      if (filter(file)) {
        // RSX components need full reload because their body only runs once on mount
        server.ws.send({ type: "full-reload" });
        return [];
      }
    },

    transform(code, id) {
      if (!filter(id)) return null;

      const result = transformSync(code, {
        filename: id,
        plugins: [rsxBabelPlugin],
        presets: [
          [
            "@babel/preset-react",
            {
              runtime: "automatic",
            },
          ],
        ],
        sourceMaps: true,
        sourceFileName: id,
      });

      if (!result) return null;

      return {
        code: result.code,
        map: result.map,
      };
    },
  };
}

export default rsxVitePlugin;
