function cb() {
  console.log('cb!');
}

(async function main() {
  setTimeout(cb, 50);
})();