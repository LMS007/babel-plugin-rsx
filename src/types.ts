import type * as React from "react";

/**
 * RSX Component lifecycle context.
 * Destructure this in your RSX component's parameter list.
 *
 * @template P - The props type for the component
 *
 * @example
 * ```tsx
 * import { rsx, type Ctx } from "@lms5400/babel-plugin-rsx/types";
 *
 * interface MyProps {
 *   name: string;
 * }
 *
 * const MyComponent = rsx<MyProps>(({ view }) => {
 *   view((props) => <div>Hello {props.name}</div>);
 * });
 * ```
 */
export type Ctx<P = Record<string, unknown>> = {
  /** Current props snapshot. Read-only. */
  props: P;
  /** Register the view/render callback. Called with current props on each render. */
  view: (cb: (props: P) => React.ReactNode) => void;
  /** Register a callback that runs when props change (after mount). */
  update: (cb: (prev: P, next: P) => void) => void;
  /** Trigger a re-render. Only the view callback is re-executed. */
  render: () => void;
  /** Register a cleanup callback that runs on unmount. */
  destroy: (cb: () => void) => void;
};

/**
 * Wraps an RSX component so TypeScript treats it as a React.FC.
 * 
 * At runtime the Babel plugin transforms RSX functions into React components,
 * but TypeScript doesn't know about this. Use `rsx()` to bridge the gap.
 *
 * @template P - The props type for the component
 * @param fn - The RSX component function
 * @returns The same function typed as React.FC<P>
 *
 * @example
 * ```tsx
 * import { rsx, type Ctx } from "@lms5400/babel-plugin-rsx/types";
 *
 * type BadgeProps = { color?: string; children: React.ReactNode };
 *
 * const Badge = rsx<BadgeProps>(({ view }) => {
 *   view((props) => <span style={{ color: props.color }}>{props.children}</span>);
 * });
 *
 * // Now Badge works in JSX:
 * <Badge color="red">Hello</Badge>
 * ```
 */
export function RSX<P = Record<string, unknown>>(
  fn: (ctx: Ctx<P>) => void
): React.FC<P> {
  return fn as unknown as React.FC<P>;
}
