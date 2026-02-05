import type { Plugin } from "vite";

export interface RsxVitePluginOptions {
  include?: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
}

/**
 * Strips TypeScript syntax from .rsx files using esbuild.
 * Must be placed before rsxVitePlugin in the plugins array.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { rsxTypeStripPlugin, rsxVitePlugin } from "@lms5400/babel-plugin-rsx/vite";
 * import react from "@vitejs/plugin-react";
 *
 * export default {
 *   plugins: [
 *     rsxTypeStripPlugin(),  // 1. Strip TypeScript
 *     rsxVitePlugin(),       // 2. RSX → React
 *     react(),               // 3. JSX → JS
 *   ],
 * };
 * ```
 */
export function rsxTypeStripPlugin(options?: RsxVitePluginOptions): Plugin;

/**
 * Main RSX Vite plugin that transforms RSX components to React.
 * Expects plain JavaScript + JSX input (TypeScript should be stripped first).
 */
export function rsxVitePlugin(options?: RsxVitePluginOptions): Plugin;

export default rsxVitePlugin;
