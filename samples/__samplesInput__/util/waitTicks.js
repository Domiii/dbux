export default async function waitTicks(n = 1) {
  while (--n >= 0) {
    await 0;
  }
}
