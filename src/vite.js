import { transformSync } from "@babel/core";
import { createFilter } from "@rollup/pluginutils";
import rsxBabelPlugin from "./index.cjs";

export function rsxVitePlugin(options = {}) {
  const filter = createFilter(options.include || /\.rsx$/, options.exclude);

  return {
    name: "vite-plugin-rsx",
    enforce: "pre",

    // Configure HMR to do full reload for RSX files
    handleHotUpdate({ file, server }) {
      if (filter(file)) {
        // RSX components need full reload because their body only runs once on mount
        server.ws.send({ type: 'full-reload' });
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
