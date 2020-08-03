
export default function getGlobal() {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-undef
    return window;
  }
  else if (typeof global !== 'undefined') {
    return global;
  }
  else {
    return globalThis;
  }
}