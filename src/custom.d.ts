import * as React from "react";

/**
 * RSX Component lifecycle context.
 * Destructure this in your RSX component's parameter list.
 *
 * @template P - The props type for the component
 */
export type Ctx<P = Record<string, unknown>> = {
  props: P;
  view: (cb: (props: P) => React.ReactNode) => void;
  update: (cb: (prev: P, next: P) => void) => void;
  render: () => void;
  destroy: (cb: () => void) => void;
};

declare module "*.rsx" {
  type RSXComponent = ((ctx: Ctx, ref?: React.Ref<unknown>) => void) &
    React.FC<Record<string, unknown>>;
  const Component: RSXComponent;
  export default Component;
}
