import { render } from "react-raw";

export default function HighResTimerRT({
  startMs = 50,
  logicStepMs = 10,
  initialFrameMs = 10,
  label = "RSX - High-Resolution Timer",
}) {
  // ─────────────────────────────────────────────
  // Persistent instance variables
  // ─────────────────────────────────────────────

  let init = true;
  init = false
  
  let elapsedMs = startMs;
  if(!init) {
    elapsedMs = elapsedMs + 1;
    init = true;
  }

  let running = false;

  let logicIntervalId = null;
  let frameIntervalId = null;

  let frameMs = initialFrameMs; // <-- dynamic frame time (ms)

  // Derived render-time value
  let currentValue = "";

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);

    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(minutes)}:${pad(seconds)}:${pad(hundredths)}`;
  }

  function restartFrameTimer() {
    if (!running) return;

    clearInterval(frameIntervalId);

    frameIntervalId = setInterval(() => {
      render();
    }, frameMs);
  }

  // ─────────────────────────────────────────────
  // Timers
  // ─────────────────────────────────────────────

  function start() {
    if (running) return;
    running = true;

    // Logic timer (fixed-step, no render)
    logicIntervalId = setInterval(() => {
      elapsedMs += logicStepMs;
    }, logicStepMs);

    // Frame timer (render loop)
    frameIntervalId = setInterval(() => {
      render();
    }, frameMs);
  }

  function stop() {
    if (!running) return;
    running = false;

    clearInterval(logicIntervalId);
    clearInterval(frameIntervalId);

    logicIntervalId = null;
    frameIntervalId = null;
  }

  function reset() {
    elapsedMs = startMs;
    render();
  }

  // ─────────────────────────────────────────────
  // Frame-rate controls
  // ─────────────────────────────────────────────

  function increaseFrameRate() {
    // Lower ms = higher FPS
    frameMs = Math.max(10, frameMs - 10);
    restartFrameTimer();
    render();
  }

  function decreaseFrameRate() {
    frameMs += 10;
    restartFrameTimer();
    render();
  }

  // ─────────────────────────────────────────────
  // Render-time derived values
  // ─────────────────────────────────────────────

  
  currentValue = formatTime(elapsedMs);

  // ─────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "monospace", width: 280 }}>
      <h3>{label} ?? [{elapsedMs}] ?? </h3>

      <div
        style={{
          fontSize: 32,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {currentValue}
      </div>

      <div style={{ textAlign: "center", marginBottom: 12 }}>
        Frame time: {frameMs} ms
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
