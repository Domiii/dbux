(async function main() {
  const { default: f } = await import('./myModule.mjs');

  console.log(f);
  console.log(f());
})();

// require('test1');
// import('test2');