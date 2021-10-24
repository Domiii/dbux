
/**
 * Same as calling arr.map(fn), but will wait for promise returned by each call to `fn` before.
 */
export async function mapAsyncSerial(arr, fn) {
  for (let i = 0; i < arr.length; i++) {
    const entry = arr[i];
    await fn(entry, i);
  }
}