// Recharts' ResponsiveContainer uses ResizeObserver, which jsdom doesn't
// implement. Polyfill it as a no-op so component tests don't false-fail on a
// jsdom-only artifact (the charts won't draw at 0×0, which is fine for a smoke
// test — we're checking the React tree mounts and reacts, not pixel output).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!('ResizeObserver' in globalThis)) {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
}
