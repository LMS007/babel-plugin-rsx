/**
 * RSX Webpack Loader
 *
 * Handles TypeScript stripping and RSX transformation for .rsx files.
 * This loader should be used INSTEAD of babel-loader for .rsx files.
 *
 * @example
 * ```js
 * // webpack.config.js
 * module.exports = {
 *   module: {
 *     rules: [
 *       // Handle .rsx files with RSX loader
 *       {
 *         test: /\.rsx$/,
 *         use: "@lms5400/babel-plugin-rsx/webpack-loader",
 *       },
 *       // Handle regular JS/TS files with babel-loader
 *       {
 *         test: /\.(js|jsx|ts|tsx)$/,
 *         exclude: /node_modules/,
 *         use: "babel-loader",
 *       },
 *     ],
 *   },
 * };
 * ```
 */

const { transformSync: esbuildTransformSync } = require("esbuild");
const { transformSync: babelTransformSync } = require("@babel/core");
const rsxBabelPlugin = require("./index.cjs");

module.exports = function rsxWebpackLoader(source) {
  const callback = this.async();
  const filename = this.resourcePath;

  try {
    // Step 1: Strip TypeScript using esbuild (preserves JSX)
    const stripped = esbuildTransformSync(source, {
      loader: "tsx",
      jsx: "preserve",
      target: "esnext",
      sourcemap: true,
      sourcefile: filename,
    });

    // Step 2: Transform RSX + JSX using Babel
    const result = babelTransformSync(stripped.code, {
      filename,
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
      sourceFileName: filename,
      inputSourceMap: stripped.map ? JSON.parse(stripped.map) : undefined,
    });

    if (!result || !result.code) {
      callback(new Error(`RSX transformation failed for ${filename}`));
      return;
    }

    callback(null, result.code, result.map);
  } catch (error) {
    callback(error);
  }
};

// Mark as raw to receive the source as a string
module.exports.raw = false;
