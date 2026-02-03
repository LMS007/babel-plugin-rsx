import React, { useState, useEffect } from "react";

export default function IntervalCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("React Interval tick, interval:", interval);
      setCount((c) => c + 1);
    }, 1000);

    console.log("React: Created interval", interval);

    return () => {
      console.log("React: Clearing interval", interval);
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
