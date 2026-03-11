# RSX Babel Plugin - Source Architecture

## Core Pipeline (3 Phases)

The plugin transforms `.rsx` files through three distinct phases:

| Phase | File | Purpose |
|-------|------|---------|
| **1. Analysis** | `analyzeComponents.cjs` | Walks AST, identifies RSX components, collects instance variables (no mutations) |
| **2. Validation** | `validateComponents.cjs` | Throws errors/warnings (destructuring) |
| **3. Transformation** | `transformPublic.cjs` | Mutates AST, injects runtime code, rewrites instance variables |

## Entry Point & Orchestration

- `index.cjs` - **Main Babel plugin entry** - orchestrates all three phases via visitor pattern
  - Only processes `.rsx` files
  - Manages `state.rsx.components` Map for multi-component support
  - Hooks into `FunctionDeclaration`, `VariableDeclarator`, `CallExpression` visitors

## Runtime Code Generation

- `rsxRuntime.cjs` - **AST builders** for injected runtime code:
  - `buildRuntimeSlots()` - Creates internal state (`__rsx_prevProps`, `__rsx_viewCb`, etc.)
  - `buildLifecycleContext()` - Builds the `ctx` object with `view()`, `update()`, `destroy()`, `render()`
  - `buildRenderFunction()` - Creates the `__rsx_render` function

## Build Tool Integrations

| File | Integration |
|------|-------------|
| `vite.js` | Vite plugin - TypeScript strip (esbuild) + RSX transform |
| `webpack-loader.cjs` | Webpack loader - same two-step process |

## TypeScript Support

- `types.ts` - Exports `Ctx<P>` type and `rsx()` wrapper function for TypeScript users
- `rsx.d.ts` & `vite.d.ts` - Type declarations for consumers

## Utilities (`/src/utils/`)

| Utility | Purpose |
|---------|---------|
| `isCapitalized.cjs` | Detects component names (uppercase = RSX component) |
| `ensureNamedImport.cjs` | Auto-imports React hooks (`useRef`, `useState`, `useEffect`) |
| `referencesProps.cjs` | Checks if expression references `props` |
| `isInternal.cjs` | Identifies internal RSX identifiers |
| `colors.cjs` | Console output formatting |

---

