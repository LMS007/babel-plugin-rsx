let currentRerender: (() => void) | null = null;

export function bindRender(fn: () => void) {
  currentRerender = fn;
}

export function render() {
  if (!currentRerender) {
    console.warn("[react-raw] render() called before bindRender()");
    return;
  }
  currentRerender();
}