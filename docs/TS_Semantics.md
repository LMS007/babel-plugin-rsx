## RSX + TypeScript Semantics

RSX components are compiled by the Babel plugin, not by TypeScript. The source
function you write always has the shape `(ctx: Ctx<Props>) => void`, while the
compiled output that React consumes matches `React.FC<Props>`. Because
TypeScript never sees the compiled output, the type checker assumes the input
shape is final. That is why JSX inside `.ts` / `.tsx` / `.rsx` files rejects an
RSX component unless you “convince” the checker that the function is really a
`React.FC`.

### Why the `RSX()` Wrapper Exists

- **Type mismatch:** JSX expects a component type assignable to
	`(props: Props) => React.ReactNode`. RSX components take a `Ctx<Props>`
	argument and return `void`, so JSX reports a diagnostic as soon as you nest
	one inside another.
- **Runtime reality:** After Babel runs, RSX components _do_ conform to the
	React contract, so everything works at runtime. The wrapper is not changing
	runtime behavior—it just applies the smallest possible type cast.
- **`RSX()` implementation:**


	```ts
  export type Ctx<P = Record<string, unknown>> = {
      props: P;
      view: (cb: (props: P) => React.ReactNode) => void;
      update: (cb: (prev: P, next: P) => void) => void;
      render: () => void;
      destroy: (cb: () => void) => void;
  };

	export function RSX<P>(fn: (ctx: Ctx<P>) => void): React.FC<P> {
		return fn as unknown as React.FC<P>;
	}
	```
	Calling `RSX()` wraps the compile-time type without altering the emitted JS,
	giving TypeScript the structure it expects while preserving RSX semantics.

### No TypeScript? No Wrapper.

When you author RSX in plain JavaScript, there is no static checker enforcing
the JSX contract. Babel transforms the file, React receives a valid component,
and everything works with zero extra steps. The `RSX()` helper is purely a
TypeScript ergonomics fix.

## Nested Component Example (JSX → RSX → RSX + JSX)

**React parent (`App.tsx`):**

```tsx
import ReactChild from "./ReactChild.tsx";
import Card from "./Card.rsx";

export default function App() {
	return (
		<section>
			<h2>Dashboard</h2>
			<Card title="Metrics">
				<ReactChild />
			</Card>
		</section>
	);
}
```

**RSX middle component (`Card.rsx`):**

```tsx
import { RSX } from "@lms5400/babel-plugin-rsx/types";
import Badge from "./Badge.rsx";
import ReactChild from "./ReactChild.tsx";

type CardProps = {
	title: string;
	children?: React.ReactNode;
};

export default RSX<CardProps>(function Card({ view }) {
	view((props) => (
		<div>
			<header>
				<h3>{props.title}</h3>
				<Badge tone="success">Live</Badge>
			</header>
			<ReactChild />
			<div>{props.children}</div>
		</div>
	));
});
```

**RSX child (`Badge.rsx`):**

```tsx
import { RSX } from "@lms5400/babel-plugin-rsx/types";

type BadgeProps = {
	tone?: string;
	children: React.ReactNode;
};

export default RSX<BadgeProps>(function Badge({ view }) {
	view((props) => (
		<span style={{ color: props.tone || "#0a0" }}>{props.children}</span>
	));
});
```

Key takeaways:

1. JSX files can freely use RSX components once they have been wrapped with
	 `RSX()`.
2. RSX components can nest other RSX components or regular React components.
3. The wrapper does not change runtime behavior; it only satisfies TypeScript’s
	 expectation that JSX components look like `React.FC`.

