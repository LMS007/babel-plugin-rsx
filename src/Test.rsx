import { render } from "react-raw";


export default function TestOnce(props) {
  console.log("RSX INIT: this should print only once");

  let counter = 0;
  counter++;

  console.log("counter value:", counter);

  // We still return something for now, even though Phase 1
  // does not yet remove the return semantics.
  return null;
}