/**
 * Ambient module declaration for .rsx file imports.
 * This allows TypeScript to understand `import X from "./Component.rsx"`
 *
 * To use: add "@lms5400/babel-plugin-rsx/types" to your tsconfig.json:
 * {
 *   "compilerOptions": {
 *     "types": ["@lms5400/babel-plugin-rsx/types"]
 *   }
 * }
 */
declare module "*.rsx" {
  import type * as React from "react";

  /** RSX components are React functional components */
  const Component: React.FC<Record<string, unknown>>;
  export default Component;
}
