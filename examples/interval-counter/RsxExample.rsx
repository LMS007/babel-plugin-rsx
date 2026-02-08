import type { Ctx } from "../../src/types";

export default function IntervalCounter({ view, render, destroy }: Ctx) {
  let count = 0; // Persistent state

  const interval = setInterval(() => {
    count++;
    render();
  }, 1000);

  // Cleanup on unmount
  destroy(() => {
    clearInterval(interval); // `interval` is also persistent state
  });

  view(() => {
    return (
      <div style={{ fontFamily: "monospace", padding: 20, textAlign: "center" }}>
        <h3>Interval Counter (RSX)</h3>
        <div style={{ fontSize: 48, margin: "20px 0" }}>
          {count}
        </div>
        <div style={{ color: "#888" }}>
          Updates every second
        </div>
      </div>
    );
  });
}
