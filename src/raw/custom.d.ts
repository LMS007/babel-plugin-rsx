declare module "*.rsx" {
  import type { FC } from "react";
  const Component: FC<any>;
  export default Component;
}