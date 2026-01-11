import { render } from "react-raw";


export default function Test({ label }) {
  let count = 0;

  function increment() {
    count++; 
    render();
  }

  return (
    <div style={{ padding: 16, border: "1px solid #ccc" }}>
      <div>{label}: {count}</div>
      <button onClick={increment}>+1</button>
    </div>
  );
}