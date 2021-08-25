function cb() {
  console.log('cb!');
}

(async function main() {
  setTimeout(cb, 50);

  console.log(cb.name, 'should not be patched');
  console.log(Array.prototype.slice.name, 'should be patched');
})();