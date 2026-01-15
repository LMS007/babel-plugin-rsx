declare module "*.rsx" {
  export type Ctx<P = Record<string, unknown>> = {
    props: P;
    view: (cb: (props: P) => React.ReactNode) => void;
    update: (cb: (prev: P, next: P) => void) => void;
    render: () => void;
    destroy: (cb: () => void) => void;
  };
  const Component: (ctx: Ctx) => void;
  export default Component;
}