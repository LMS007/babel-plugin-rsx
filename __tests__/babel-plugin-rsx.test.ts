import { transformSync } from "@babel/core";
import { describe, expect, it } from "vitest";
//import { vi } from "vitest";
import rsxVitePlugin from "../src/index.cjs";

function transform(code: string, filename = "test.rsx") {
  const result = transformSync(code, {
    plugins: [rsxVitePlugin],
    filename,
    presets: ["@babel/preset-react"],
  });
  return result?.code || "";
}

describe("babel-plugin-rsx", () => {
  describe("file extension filtering", () => {
    it("transforms .rsx files", () => {
      const input = `export default function App({ view }) {
        let count = 0;
        view(() => <div>{count}</div>);
      }`;
      const output = transform(input, "App.rsx");
      expect(output).toContain("__instance");
      expect(output).toContain("useRef");
    });

    it("skips non-.rsx files", () => {
      const input = `export default function App() {
        let count = 0;
        return <div>{count}</div>;
      }`;
      const output = transform(input, "App.tsx");
      expect(output).not.toContain("__instance");
    });

    it("skips .jsx files", () => {
      const input = `export default function App() {
        let count = 0;
        return <div>{count}</div>;
      }`;
      const output = transform(input, "App.jsx");
      expect(output).not.toContain("__instance");
    });
  });

  describe("instance variable transformation", () => {
    it("transforms let declarations to instance properties", () => {
      const input = `export default function App({ view, render }) {
        let count = 0;
        function increment() {
          count++;
          render();
        }
        view(() => <button onClick={increment}>{count}</button>);
      }`;
      const output = transform(input);
      expect(output).toContain("__instance");
    });

    it("preserves initial values", () => {
      const input = `export default function App({ view }) {
        let name = "hello";
        let num = 42;
        view(() => <div>{name}</div>);
      }`;
      const output = transform(input);
      expect(output).toContain('"hello"');
      expect(output).toContain("42");
    });

    it("handles null initial values", () => {
      const input = `export default function App({ view }) {
        let ref = null;
        view(() => <div ref={ref} />);
      }`;
      expect(() => transform(input)).not.toThrow();
    });

    it("rewrites variables inside nested callbacks (view, update, etc.)", () => {
      const input = `export default function App({ view, update, render }) {
        let count = 0;
        let name = "test";
        
        view((props) => {
          // Variables referenced inside view callback should be rewritten
          return <div>{count} - {name}</div>;
        });
        
        update((prev, next) => {
          // Variables referenced inside update callback should be rewritten
          count = 0;
          name = "reset";
        });
        
        function handleClick() {
          // Variables referenced inside nested functions should be rewritten
          count++;
          render();
        }
      }`;
      const output = transform(input);
      // Variables inside callbacks should be rewritten to __instance.x
      expect(output).toContain("__instance.count");
      expect(output).toContain("__instance.name");
      // The JSX should reference __instance.count, not bare count
      expect(output).toMatch(/__instance\.count.*__instance\.name/);
      // Assignments inside update should be __instance.x = 
      expect(output).toContain("__instance.count = 0");
      expect(output).toContain('__instance.name = "reset"');
      // Increment inside handleClick should be __instance.count++
      expect(output).toContain("__instance.count++");
    });

    it("rewrites variables used as computed property keys in deeply nested callbacks", () => {
      const input = `export default function DataTable({ view, render }) {
        let sortKey = "id";
        let data = [];
        
        function recompute() {
          data = [].sort((a, b) => {
            const v1 = a[sortKey];
            const v2 = b[sortKey];
            return v1 < v2 ? -1 : 1;
          });
        }
        
        view(() => {
          recompute();
          return <div>{sortKey}</div>;
        });
      }`;
      const output = transform(input);
      // sortKey should be rewritten to __instance.sortKey in computed property access
      expect(output).toContain("a[__instance.sortKey]");
      expect(output).toContain("b[__instance.sortKey]");
    });
  });

  /*describe("hook banning", () => {
    it("warns for useState", () => {
      const input = `import { useState } from 'react';
      export default function App({ view }) {
        const [x, setX] = useState(0);
        view(() => <div>{x}</div>);
      }`;
      const spy = vi.spyOn(console, "warn");
      transform(input);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("warns for useMemo", () => {
      const input = `import { useMemo } from 'react';
      export default function App({ view }) {
        const val = useMemo(() => 42, []);
      }`;
      const spy = vi.spyOn(console, "warn");
      transform(input);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("warns for useCallback", () => {
      const input = `import { useCallback } from 'react';
      export default function App({ view }) {
        const cb = useCallback(()=>{},[]);
      }`;
      const spy = vi.spyOn(console, "warn");
      transform(input);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("warns for useRef", () => {
      const input = `import { useRef } from 'react';
      export default function App({ view }) {
        const val = useRef(42);
        view(() => <div>{val}</div>);
      }`;
      const spy = vi.spyOn(console, "warn");
      transform(input);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });*/

  describe("props handling", () => {
    it("throws error when mutating props", () => {
      const input = `export default function App({ view, props }) {
        props.value = 123;
        view(() => <div />);
      }`;
      expect(() => transform(input)).toThrow(/Props are immutable/);
    });

    it("allows reading props", () => {
      const input = `export default function App({ view, props }) {
        let initial = props.value;
        view((p) => <div>{p.name}</div>);
      }`;
      expect(() => transform(input)).not.toThrow();
    });

    it("defers initialization when instance var references props destructuring", () => {
      const input = `export default function App({ view, props }) {
        let { onBrightnessChange } = props;
        let currentCallback = onBrightnessChange;
        view(() => <div />);
      }`;
      const output = transform(input);
      // currentCallback should be initialized to undefined in __instanceRef.current
      // because its initializer references onBrightnessChange from props destructuring
      expect(output).toContain("currentCallback: undefined");
      // The deferred assignment should be in __userInit
      expect(output).toContain("__instance.currentCallback = onBrightnessChange");
    });

    it("defers initialization when instance var references another instance var", () => {
      const input = `export default function App({ view }) {
        let baseValue = 10;
        let derivedValue = baseValue * 2;
        view(() => <div>{derivedValue}</div>);
      }`;
      const output = transform(input);
      // derivedValue should be initialized to undefined because it references baseValue
      expect(output).toContain("derivedValue: undefined");
      // The deferred assignment should be in __userInit
      expect(output).toContain("__instance.derivedValue = __instance.baseValue * 2");
    });

    it("uses immediate initialization for instance vars with literal values", () => {
      const input = `export default function App({ view }) {
        let count = 42;
        let name = "test";
        view(() => <div>{count} {name}</div>);
      }`;
      const output = transform(input);
      // These should be initialized immediately, not deferred
      expect(output).toContain("count: 42");
      expect(output).toContain('name: "test"');
    });

    it("defers initialization when instance var contains object with local reference", () => {
      const input = `export default function App({ view, props }) {
        let { callback } = props;
        let config = { handler: callback, value: 10 };
        view(() => <div />);
      }`;
      const output = transform(input);
      // config should be deferred because it references callback from props
      expect(output).toContain("config: undefined");
      expect(output).toContain("__instance.config = {");
    });

    it("defers initialization when instance var is arrow function capturing locals", () => {
      const input = `export default function App({ view, props }) {
        let { multiplier } = props;
        let compute = (x) => x * multiplier;
        view(() => <div>{compute(5)}</div>);
      }`;
      const output = transform(input);
      // compute should be deferred because the arrow function captures multiplier
      expect(output).toContain("compute: undefined");
      expect(output).toContain("__instance.compute = x => x * multiplier");
    });

    it("defers initialization with template literal referencing locals", () => {
      const input = `export default function App({ view }) {
        let count = 0;
        let message = \`Count is: \${count}\`;
        view(() => <div>{message}</div>);
      }`;
      const output = transform(input);
      // message should be deferred because template literal references count
      expect(output).toContain("message: undefined");
      expect(output).toContain("__instance.message = `Count is: ${__instance.count}`");
    });

    it("handles chained local references - all deferred", () => {
      const input = `export default function App({ view, props }) {
        let { value } = props;
        let a = value;
        let b = a;
        let c = b;
        view(() => <div>{c}</div>);
      }`;
      const output = transform(input);
      // All should be deferred due to chain of local references
      expect(output).toContain("a: undefined");
      expect(output).toContain("b: undefined");
      expect(output).toContain("c: undefined");
    });

    it("does NOT defer initialization for external imports", () => {
      const input = `
        import { someHelper } from './utils';
        export default function App({ view }) {
          let helper = someHelper;
          let count = 0;
          view(() => <div>{helper(count)}</div>);
        }`;
      const output = transform(input);
      // helper should be initialized immediately since someHelper is an import, not a local
      expect(output).toContain("helper: someHelper");
      // count is a literal, also immediate
      expect(output).toContain("count: 0");
    });

    it("does NOT defer initialization for global/built-in references", () => {
      const input = `export default function App({ view }) {
        let pi = Math.PI;
        let log = console.log;
        let arr = Array.from([1, 2, 3]);
        view(() => <div>{pi}</div>);
      }`;
      const output = transform(input);
      // These reference globals, not locals, so should be immediate
      expect(output).toContain("pi: Math.PI");
      expect(output).toContain("log: console.log");
      expect(output).toContain("arr: Array.from");
    });

    it("handles nested object destructuring from props", () => {
      const input = `export default function App({ view, props }) {
        let { config: { theme, size } } = props;
        let currentTheme = theme;
        view(() => <div className={currentTheme}>{size}</div>);
      }`;
      const output = transform(input);
      // currentTheme should be deferred because theme comes from nested destructuring
      expect(output).toContain("currentTheme: undefined");
      expect(output).toContain("__instance.currentTheme = theme");
    });

    it("handles array destructuring from props", () => {
      const input = `export default function App({ view, props }) {
        let [first, second] = props.items;
        let selected = first;
        view(() => <div>{selected}</div>);
      }`;
      const output = transform(input);
      // selected should be deferred because first comes from array destructuring
      expect(output).toContain("selected: undefined");
      expect(output).toContain("__instance.selected = first");
    });
  });

  describe("lifecycle methods", () => {
    it("preserves view callback", () => {
      const input = `export default function App({ view }) {
        view(() => <div>Hello</div>);
      }`;
      const output = transform(input);
      expect(output).toContain("__rsx_viewCb");
    });

    it("preserves update callback", () => {
      const input = `export default function App({ view, update }) {
        update((prev, next) => console.log(prev, next));
        view(() => <div />);
      }`;
      const output = transform(input);
      expect(output).toContain("__rsx_updateCb");
    });

    it("preserves destroy callback", () => {
      const input = `export default function App({ view, destroy }) {
        destroy(() => console.log('cleanup'));
        view(() => <div />);
      }`;
      const output = transform(input);
      expect(output).toContain("__rsx_destroyCb");
    });
  });

  describe("render triggering", () => {
    it("generates force update mechanism", () => {
      const input = `export default function App({ view, render }) {
        let x = 0;
        function inc() { x++; render(); }
        view(() => <button onClick={inc}>{x}</button>);
      }`;
      const output = transform(input);
      expect(output).toContain("__rsxForceUpdate");
    });
  });

  describe("edge cases", () => {
    it("handles empty component", () => {
      const input = `export default function App({ view }) {
        view(() => null);
      }`;
      expect(() => transform(input)).not.toThrow();
    });

    it("handles component with no view call", () => {
      const input = `export default function App() {
        // No view registered
      }`;
      expect(() => transform(input)).not.toThrow();
    });

    it("handles missing update function gracefully", () => {
      const input = `export default function App({ view }) {
        view(() => <div>Test</div>);
        // No update function provided
      }`;
      expect(() => transform(input)).not.toThrow();
    });

    it("handles multiple variables", () => {
      const input = `export default function App({ view }) {
        let a = 1;
        let b = 2;
        let c = 3;
        view(() => <div>{a + b + c}</div>);
      }`;
      expect(() => transform(input)).not.toThrow();
      const output = transform(input);
      expect(output).toContain("__instance");
    });

    it("handles functions defined in component", () => {
      const input = `export default function App({ view, render }) {
        let count = 0;

        function increment() {
          count++;
          render();
        }

        function decrement() {
          count--;
          render();
        }

        view(() => (
          <div>
            <button onClick={decrement}>-</button>
            <span>{count}</span>
            <button onClick={increment}>+</button>
          </div>
        ));
      }`;
      expect(() => transform(input)).not.toThrow();
    });

    it("does not transform lowercase file-scope functions", () => {
      const input = `
        function helperFunction(x) {
          return x * 2;
        }

        function anotherHelper() {
          console.log("helper");
        }

        export default function App({ view }) {
          view(() => <div>{helperFunction(5)}</div>);
        }
      `;
      const output = transform(input);
      // The lowercase functions should remain untouched
      expect(output).toContain("function helperFunction(x)");
      expect(output).toContain("return x * 2");
      expect(output).toContain("function anotherHelper()");
      // They should NOT have RSX runtime injected
      expect(output).not.toMatch(/function helperFunction\([^)]*\)\s*\{[^}]*__instance/);
      expect(output).not.toMatch(/function anotherHelper\(\)\s*\{[^}]*__instance/);
      // But App should be transformed
      expect(output).toContain("__instanceRef");
    });
  });

  describe("multi-component support", () => {
    it("transforms multiple components in a single file", () => {
      const input = `
        function Header({ view }) {
          let title = "Hello";
          view(() => <header>{title}</header>);
        }

        function Footer({ view }) {
          let year = 2026;
          view(() => <footer>{year}</footer>);
        }

        export { Header, Footer };
      `;
      const output = transform(input);
      // Both components should be transformed
      expect(output).toContain("__instance");
      // Should have two separate __instanceRef declarations (one per component)
      const instanceRefMatches = output.match(/__instanceRef/g);
      expect(instanceRefMatches?.length).toBeGreaterThanOrEqual(2);
    });

    it("transforms exported and non-exported uppercase components", () => {
      const input = `
        function PrivateComponent({ view }) {
          let hidden = true;
          view(() => <div>{hidden ? "hidden" : "visible"}</div>);
        }

        export function PublicComponent({ view }) {
          let visible = false;
          view(() => <div><PrivateComponent /></div>);
        }
      `;
      const output = transform(input);
      expect(output).toContain("__instance");
      // Both should be transformed
      const instanceRefMatches = output.match(/__instanceRef/g);
      expect(instanceRefMatches?.length).toBeGreaterThanOrEqual(2);
    });

    it("ignores lowercase helper functions", () => {
      const input = `
        function formatDate(date) {
          return date.toISOString();
        }

        function Calendar({ view }) {
          let date = new Date();
          view(() => <div>{formatDate(date)}</div>);
        }

        export { Calendar };
      `;
      const output = transform(input);
      // Only Calendar should be transformed, not formatDate
      // formatDate should remain a normal function
      expect(output).toContain("function formatDate(date)");
      // Calendar should be transformed
      expect(output).toContain("__instance");
    });

    it("keeps instance variables separate between components", () => {
      const input = `
        function Counter({ view }) {
          let count = 0;
          view(() => <div>{count}</div>);
        }

        function Timer({ view }) {
          let seconds = 0;
          view(() => <div>{seconds}</div>);
        }

        export { Counter, Timer };
      `;
      const output = transform(input);
      // Both components should have their own __instance with their own variables
      expect(output).toContain("count:");
      expect(output).toContain("seconds:");
    });

    it("handles export default with named components", () => {
      const input = `
        function Header({ view }) {
          let text = "header";
          view(() => <h1>{text}</h1>);
        }

        export default function App({ view }) {
          let count = 0;
          view(() => <div><Header />{count}</div>);
        }
      `;
      const output = transform(input);
      // Both should be transformed
      const instanceRefMatches = output.match(/__instanceRef/g);
      expect(instanceRefMatches?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("StrictMode compatibility", () => {
    it("includes __rsx_effectMounted flag in instance object", () => {
      const input = `export default function Counter({ view }) {
        let count = 0;
        view(() => <div>{count}</div>);
      }`;
      const output = transform(input);
      
      // Instance should have the effectMounted flag for StrictMode tracking
      expect(output).toContain("__rsx_effectMounted");
    });

    it("resets flags in useEffect cleanup for proper remount", () => {
      const input = `export default function Counter({ view, destroy }) {
        let count = 0;
        view(() => <div>{count}</div>);
        destroy(() => {});
      }`;
      const output = transform(input);
      
      // The useEffect cleanup should reset both flags
      expect(output).toContain("__instance.__rsx_initialized = false");
      expect(output).toContain("__instance.__rsx_effectMounted = false");
    });

    it("re-runs __userInit in useEffect mount phase for StrictMode remount", () => {
      const input = `export default function App({ view, destroy }) {
        let cleanup = null;
        view(() => <div />);
        destroy(() => { cleanup(); });
      }`;
      const output = transform(input);
      
      // The useEffect should call __userInit on mount when not initialized
      expect(output).toContain("__userInit.call");
      // Should also trigger a force update after init in effect
      expect(output).toContain("__rsxForceUpdate");
    });
  });
});
