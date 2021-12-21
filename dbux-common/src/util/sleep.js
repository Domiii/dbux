const P = Promise;
export default async function sleep(ms) { return new P(r => setTimeout(r, ms)); }