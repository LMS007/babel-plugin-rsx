export default function IntervalCounter({ view, render, destroy }) {
  // Persistent state
  let count = 0;

  // Setup interval
  function run() {
    count++;
    console.log("Interval tick, count:", count);
    render();
  }
  
  console.log("Setting up interval...");
  const interval = setInterval(() => {
    run();
  }, 1000);

  console.log("Interval id:", interval);

  // Cleanup on unmount
  destroy(() => {
    console.log("Cleaning up interval:", interval);
    clearInterval(interval);
  });

  // View
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
