(async function main() {
  const { default: f } = await import('./myModule.mjs');

  console.log(f);
  console.log(f());
})();
