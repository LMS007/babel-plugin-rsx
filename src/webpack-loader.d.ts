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
 *       {
 *         test: /\.rsx$/,
 *         use: "@lms5400/babel-plugin-rsx/webpack-loader",
 *       },
 *     ],
 *   },
 * };
 * ```
 */
declare function rsxWebpackLoader(
  this: { async(): (err: Error | null, content?: string, sourceMap?: unknown) => void; resourcePath: string },
  source: string
): void;

export = rsxWebpackLoader;
