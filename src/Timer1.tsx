import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

export default function HighResTimer({
  startMs = 0,
  logicStepMs = 10,
  initialFrameMs = 10,
  label = "React High-Resolution Timer",
}) {
  // ─────────────────────────────────────────────
  // Persistent mutable values (refs)
  // ─────────────────────────────────────────────

  const elapsedMsRef = useRef(startMs);
  const runningRef = useRef(false);

  const logicIntervalRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const frameMsRef = useRef(initialFrameMs);

  // ─────────────────────────────────────────────
  // Render trigger
  // ─────────────────────────────────────────────

  const [, forceRender] = useState(0);

  const render = useCallback(() => {
    forceRender((v) => v + 1);
  }, []);

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  const formatTime = useCallback((ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);

    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(minutes)}:${pad(seconds)}:${pad(hundredths)}`;
  }, []);

  // ─────────────────────────────────────────────
  // Timer management
  // ─────────────────────────────────────────────

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    logicIntervalRef.current = setInterval(() => {
      elapsedMsRef.current += logicStepMs;
    }, logicStepMs);

    frameIntervalRef.current = setInterval(() => {
      render();
    }, frameMsRef.current);
  }, [logicStepMs, render]);

  const stop = useCallback(() => {
    if (!runningRef.current) return;
    runningRef.current = false;

    clearInterval(logicIntervalRef.current);
    clearInterval(frameIntervalRef.current);

    logicIntervalRef.current = null;
    frameIntervalRef.current = null;
  }, []);

  const reset = useCallback(() => {
    elapsedMsRef.current = startMs;
    render();
  }, [startMs, render]);

  const restartFrameTimer = useCallback(() => {
    if (!runningRef.current) return;

    clearInterval(frameIntervalRef.current);

    frameIntervalRef.current = setInterval(() => {
      render();
    }, frameMsRef.current);
  }, [render]);

  // ─────────────────────────────────────────────
  // Frame rate controls
  // ─────────────────────────────────────────────

  const increaseFrameRate = useCallback(() => {
    frameMsRef.current = Math.max(10, frameMsRef.current - 10);
    restartFrameTimer();
    render();
  }, [restartFrameTimer, render]);

  const decreaseFrameRate = useCallback(() => {
    frameMsRef.current += 10;
    restartFrameTimer();
    render();
  }, [restartFrameTimer, render]);

  // ─────────────────────────────────────────────
  // Cleanup on unmount
  // ─────────────────────────────────────────────

  useEffect(() => {
    return () => {
      clearInterval(logicIntervalRef.current);
      clearInterval(frameIntervalRef.current);
    };
  }, []);

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  const currentValue = formatTime(elapsedMsRef.current);

  return (
    <div style={{ fontFamily: "monospace", width: 280 }}>
      <h3>{label}</h3>

      <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>
        {currentValue}
      </div>

      <div style={{ textAlign: "center", marginBottom: 12 }}>
        Frame time: {frameMsRef.current} ms
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button onClick={start}>Start</button>
        <button onClick={stop}>Stop</button>
        <button onClick={reset}>Reset</button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          marginTop: 10,
        }}
      >
        <button onClick={increaseFrameRate}>Increase Frame Rate</button>
        <button onClick={decreaseFrameRate}>Decrease Frame Rate</button>
      </div>
    </div>
  );
}
