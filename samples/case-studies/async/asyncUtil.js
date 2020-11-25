
export async function sleep(delay) {
  return new Promise(r => setTimeout(r, delay));
}