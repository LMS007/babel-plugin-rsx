# RSX Component Execution & Lifecycle Specification

This document defines the **runtime semantics of an RSX component**. It is intentionally descriptive and normative, not a tutorial. The goal is to allow automated systems (LLMs, code generators, analyzers) to correctly construct RSX components from prompts.

---

## 1. RSX Component Shape

An RSX component is authored as a single exported function in a `.rsx` file.


```ts
// The ctx parameter must always be destructured:
export default function Component({ view, update, destroy, render, props }) {
  // root scope
}
```

### Function Parameters

| Parameter | Required | Description                                            |
| --------- | -------- | ------------------------------------------------------ |
| `{ view, update, destroy, render, props }` | yes | Destructured lifecycle context object injected by the RSX compiler. **Must always be destructured.** |

> **Note:** Always destructure the `ctx` object in the parameter list. Do **not** use `ctx` as a single object parameter.

The function signature is preserved to remain compatible with React's component calling convention.

---

## 2. Function Naming & Component Detection

RSX uses **function name casing** to determine what gets transformed:

### Uppercase = RSX Component

Any function in a `.rsx` file whose name starts with an **uppercase letter** (A-Z) is treated as an RSX component and receives the full transformation:

```ts
// ✅ Transformed as RSX components
function Counter({ view, render }) { ... }
function DataTable({ view, update }) { ... }
export default function App({ view }) { ... }
```

### Lowercase = Helper Function

Functions starting with a **lowercase letter** are left untouched. They remain regular JavaScript functions:

```ts
// ❌ NOT transformed - regular helper functions
function formatDate(date) { return date.toISOString(); }
function calculateTotal(items) { return items.reduce(...); }
```

### Multi-Component Files

A single `.rsx` file can contain **multiple RSX components**:

```ts
// Badge.rsx - contains multiple components

function Badge({ view }) {
  view((props) => <span className="badge">{props.label}</span>);
}

function Card({ view }) {
  view((props) => (
    <div className="card">
      <Badge label={props.tag} />
      {props.children}
    </div>
  ));
}

export default function CardList({ view }) {
  view((props) => (
    <div>
      {props.items.map(item => <Card key={item.id} {...item} />)}
    </div>
  ));
}
```

> Note See [TypeScript details](docs/TS_Semantics.md) if you are using Typescript with RSX components.

Each uppercase function:
- Gets its own instance variable storage
- Has independent lifecycle callbacks
- Is transformed separately

Helper functions (lowercase) can be shared across all components in the file.

---

## 3. Execution Model (Critical Invariant)


### **The RSX component body executes exactly once per mounted instance.**

- The user-authored function body is **not re-executed** on React re-renders.
- There is no equivalent to React's render phase for user code.
- All user logic runs during a single initialization phase guarded by an internal instance flag.

React may invoke the outer component function multiple times, but RSX guarantees that **user code runs once and only once per instance**.

---

## 4. Instance Lifetime & Persistence

### Root-Scope Persistence

All variables declared in the root scope of the RSX component:

```ts
let count = 0;
let timerId;
function increment() { ... }
```

have the following properties:

- They are allocated **once** per component instance
- They persist for the **entire mounted lifetime** of the component
- They are stored on an internal per-instance object
- Reads and writes always resolve to the same instance-scoped storage


There is no concept of re-initialization, re-render execution, or closure recreation.

> **RSX variables behave like instance fields, not render-scoped locals.**

---

## 5. The Lifecycle Context

```ts
export type Ctx<P = Record<string, unknown>> = {
  props: P;
  view: (cb: (props: P) => React.ReactNode) => void;
  update: (cb: (prev: P, next: P) => void) => void;
  render: () => void;
  destroy: (cb: () => void) => void;
};
```


The RSX compiler injects a stable ctx object into the component. This object exposes lifecycle registration and control primitives.



### 5.1 `view(fn)`

Registers the view function.

```ts
  view((props) => <>hello world</>);

```


**Semantics**

- Stores `fn` as the component's view callback
- The function is **never redefined or re-registered implicitly**
- Must return JSX (or `null`)


**Invocation**

- Called internally whenever RSX performs a render pass
- Receives the **current props snapshot**

---

### 5.2 `update(fn)`


Registers a props update handler.

```ts
update((prevProps, nextProps) => { ... })

```


**Semantics**

- Invoked automatically when React props change
- Runs **after mount**, never during initialization
- Receives previous and next props by reference


**Ordering**

1. `update(prev, next)`
2. implicit render

---

### 5.3 `destroy(fn)`


Registers a cleanup handler.

```ts
destroy(() => { ... })
```


**Semantics**

- Stored once during initialization
- Invoked exactly once on unmount
- Guaranteed to run before instance disposal

---

### 5.4 `render()`


Explicitly schedules a render.

```ts
render();
```


**Semantics**

- Forces execution of the registered `view` callback
- Triggers a React re-render via an internal state tick
- Safe to call from any event, timer, or external system


**Important**

- Calling `render()` does **not** re-execute user code
- Only the view function is re-evaluated

---

### 5.5 `props`


A getter that returns the current props snapshot.

```ts
const initialProps = props;
```


**Semantics**


- On mount: reflects props passed during the first render
- After mount: updated automatically before `update()` is called
- Read-only; do not mutate props

Values read from `props` in the root scope are captured once and will not update unless explicitly reassigned in `update()`.

---

## 6. Initialization Sequence (Exact Order)

For each mounted RSX component instance:

1. The user component body executes **once**, receiving lifecycle methods and props in the destructured ctx parameter
2. The initial `view()` is executed once
3. JSX output is returned to React

At no point is the user body executed again.

---

## 7. Update Sequence

On subsequent React renders:

1. Props are compared by reference
2. If unchanged → no user code runs
3. If changed:
   - `update(prevProps, nextProps)` is invoked
   - `view(nextProps)` is executed

4. JSX output is returned

---

## 8. Return Semantics

- User `return` statements in the main component body are ignored
- The RSX runtime exclusively controls what is returned
- The rendered value is the result of the most recent `view()` execution

If no view has produced output, `null` is returned.

---


## 9. Hook Restrictions

RSX components must not invoke:

- React built-in hooks
- Custom hooks
- Hook-like abstractions

Formally:

> **Any function whose name matches `/^use[A-Z]/` must not be used inside `.rsx` files and will throw an error if you use the RSX eslint plugin.**

See: https://github.com/LMS007/eslint-plugin-rsx

This includes, but is not limited to:

- `useState`
- `useEffect`
- `useMemo`
- `useCallback`
- `useContext`
- `useMyProvider`

### Rationale


- RSX user code executes once per instance
- Hooks assume repeated render-phase execution
- Dependency arrays, memoization, and effect scheduling have no semantic meaning in RSX


RSX replaces hook functionality with explicit lifecycle primitives:

| React Hook          | RSX Equivalent                    |
| ------------------- | --------------------------------- |
| `useState`          | root-scope variables + `render()` |
| `useEffect([])`     | root-scope execution              |
| `useEffect(dep)`    | `update(prev, next)`              |
| `useEffect cleanup` | `destroy()`                       |
| `useMemo`           | explicit caching / update logic   |
| `useCallback`       | stable functions by default       |

---

## 10. Integrating RSX with Providers and Shared State

RSX does not call providers or hooks directly. Instead, it integrates with shared state using one of two explicit patterns.

---

### 10.1 Pattern A (Recommended): Upstream Store / Dual Adapter

**Move the source of truth upstream of React.**

```
Source of Truth (Store)
        │
 ┌──────┴────────┐
 │               │
React Provider   RSX Component
(Hook Adapter)  (Direct Subscribe)
```

**Store Contract**

```ts
interface RSXStore<T> {
  get(): T;
  set?(value: T): void;
  subscribe(cb: (value: T) => void): () => void;
}
```

**RSX Usage**

- Read initial value via `get()`
- Subscribe during initialization
- Call `render()` when notified
- Unsubscribe in `destroy()`

**Benefits**

- Framework-agnostic state
- No prop threading
- No stale captures
- Ideal for real-time, external, or persistent data


This is the **preferred architecture** for RSX interoperability.

---

### 10.2 Pattern B (Compatibility): Proxy Through Parent React Component

**Let React own the state and pass snapshots into RSX via props.**

```
Provider (Hooks)
      │
Parent React Component
      │
RSX Component (props)
```

**RSX Usage**

- Capture initial props in root scope
- Reassign derived values in `update(prev, next)`
- Render from local instance state

**Use When**

- The provider is third-party or legacy
- Refactoring state ownership is not feasible
- State is local to a React subtree


This pattern is valid but less autonomous than an upstream store.

---

## 11. Using Refs

RSX does not use `useRef`. Instead, refs are handled using **plain instance variables** and **callback refs**.

```jsx
type ChildProps = {
  title: string;
  ref?: React.Ref<HTMLInputElement>;
};

const Child = RSX<ChildProps>(({ view }) => {
  view((props) => (
    <div>
      <h4>{props.title}</h4>
      <input ref={props.ref} />
    </div>
  ));
});
```

**Parent component** - passes a callback ref via props:

```jsx
export default function App({ view }: Ctx) {
  let cardInputRef: HTMLInputElement | null = null;

  // this can be any event handler after view is executed
  setTimeout(() => {  
    if (cardInputRef) {
      console.log("Focusing card input...");
      cardInputRef.focus();
    }
  }, 1000);

  view(() => (
    <Child title="Welcome" ref={(node) => { cardInputRef = node; }} />
  ));
}
```

### Why This Works

- RSX instance variables persist for the component's lifetime (like `useRef`)
- Callback refs are called by React when the element mounts/unmounts
- No special forwarding mechanism needed—`ref` is just a prop

### Comparison with React

| React                          | RSX                                    |
| ------------------------------ | -------------------------------------- |
| `const ref = useRef(null)`     | `let ref = null`                       |
| `ref.current`                  | `ref` (direct access)                  |
| `React.forwardRef()`           | Pass `ref` as a regular prop           |
| `useImperativeHandle()`        | Not needed—expose methods via props    |

---

## 12. Compilation Pipeline

RSX files are processed through a multi-stage compilation pipeline. Understanding this pipeline is important for tooling authors and advanced users.

### 12.1 Pipeline Overview

RSX supports both plain JavaScript and TypeScript syntax. TypeScript is **optional**—if your `.rsx` files contain only JavaScript + JSX, the type-strip stage is a no-op.

**With TypeScript (optional):**
```
.rsx source (TypeScript + JSX)
        │
        ▼
┌───────────────────────────────┐
│  1. TypeScript Strip (esbuild)│  ← Erases TS syntax, preserves JSX
│     loader: "tsx"             │     (no-op if no TS syntax present)
│     jsx: "preserve"           │
└───────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│  2. RSX Transform (Babel)     │  ← Converts RSX → React components
│     Parser: JS + JSX only     │
└───────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│  3. React Plugin              │  ← Converts JSX → JS
│     @vitejs/plugin-react      │
└───────────────────────────────┘
        │
        ▼
    JavaScript output
```

**Plain JavaScript (no TypeScript):**
```
.rsx source (JavaScript + JSX)
        │
        ▼
┌───────────────────────────────┐
│  1. RSX Transform (Babel)     │  ← Converts RSX → React components
└───────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│  2. React Plugin              │  ← Converts JSX → JS
└───────────────────────────────┘
        │
        ▼
    JavaScript output
```

### 12.2 Key Invariant

**The RSX Babel transform only ever sees plain JavaScript + JSX.**

TypeScript is an authoring-time concern and is completely erased before RSX compilation begins. This keeps the RSX compiler simple and focused on its core responsibility: transforming the RSX component model into React-compatible code.

### 12.3 Vite Plugin Configuration

When using TypeScript in `.rsx` files, configure plugins in this order:

```ts
// vite.config.ts
import { rsxTypeStripPlugin, rsxVitePlugin } from "@lms5400/babel-plugin-rsx/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    rsxTypeStripPlugin(),  // 1. Strip TypeScript (enforce: "pre")
    rsxVitePlugin(),       // 2. RSX → React transformation
    react(),               // 3. JSX → JS (React plugin)
  ],
});
```

If your `.rsx` files contain only JavaScript (no TypeScript), the `rsxTypeStripPlugin` can be omitted.

### 12.4 Sourcemaps

Each stage preserves sourcemaps, ensuring that:
- Error messages point to original `.rsx` source locations
- Stack traces map correctly during debugging
- Browser devtools show the original TypeScript/JSX code

---

## 13. Mental Model Summary (For AI Systems)


- RSX components are **stateful instances**, not render functions
- The root scope executes once and persists
- Hooks are forbidden
- React provides rendering and reconciliation only
- RSX reacts explicitly to changes via `update()` and subscriptions

