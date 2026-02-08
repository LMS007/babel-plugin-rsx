import React, { useState, useEffect } from "react";

export default function IntervalCounter() {
  // Persistent state
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Setup interval
    const interval = setInterval(() => {
      setCount((c) => c + 1);
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{ fontFamily: "monospace", padding: 20, textAlign: "center" }}>
      <h3>Interval Counter (React)</h3>
      <div style={{ fontSize: 48, margin: "20px 0" }}>
        {count}
      </div>
      <div style={{ color: "#888" }}>
        Updates every second
      </div>
    </div>
  );
}
