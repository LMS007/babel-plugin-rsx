# RSX

**RSX** is a deterministic, model-driven UI runtime that looks like JSX but behaves like plain JavaScript.

If you’ve ever fought React’s lifecycle, StrictMode double-effects, or hook-induced complexity — RSX is the opposite of that.

> **No hooks. No component instances. No hidden lifecycles.  
Just state, render, and control.**

---

## Why RSX?

Modern UI frameworks optimize for convenience — RSX optimizes for **control**.

RSX treats UI as a **pure projection of a model**, not a web of implicit lifecycles.
 
## Why RSX Helps with Hook-Heavy Components

Components that interface with **timers, events, real-time systems, or hardware** often become dominated by `useCallback`, `useMemo`, and `useRef` when written in React. These hooks aren’t adding new capabilities — they are compensating for React’s render and lifecycle model.

React re-runs components frequently and implicitly. As a result:

- Functions are recreated on every render, requiring `useCallback`
- Expensive computations must be guarded with `useMemo`
- Long-lived resources are detached from component instances using `useRef`
- Timers and event handlers must survive re-renders without breaking identity
- Correctness depends on dependency arrays and identity stabilization

This leads to complex and fragile code, especially for real-time or hardware-driven systems.

RSX removes the root cause.

In RSX:

- Rendering happens only when you explicitly call `render()`
- Models and refs live at module scope and persist naturally
- Functions do not require identity stabilization
- Timers, event listeners, and hardware interfaces are initialized once and owned explicitly
- Cleanup is intentional and controlled, not implicit

For real-time systems and hardware integration, this results in:

- Fewer abstractions
- Clear ownership of resources
- Deterministic behavior
- Code that is easier to reason about and debug

> **RSX doesn’t replace hooks — it makes most of them unnecessary.**


### RSX is for you if you want:
- Deterministic initialization
- Explicit state ownership
- Zero magic re-renders
- Debuggable behavior
- Tight control over resources

---

## What RSX Is (and Isn’t)

### RSX **is**
- A JSX-like syntax
- A render-on-demand UI system
- Model-driven
- Explicit lifecycle
- Single-pass rendering
- Extremely predictable

### RSX **is not**
- React
- Hook-based
- Instance-based
- Lifecycle-driven
- Reactive by default

---

## Core Mental Model



```js
import { render } from "rsx";

const model = {
  count: 0,
};

function inc() {
  model.count++;
  render();
}

export function App() {
  return (
    <button onClick={inc}>
      Count: {model.count}
    </button>
  );
}

render(<App />);
