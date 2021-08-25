function cb() {
}
function cb2() {
}

cb.x = 3;
cb2.x = 4;

console.log(cb.x === 3, cb);

setTimeout(cb);

const mergeExports = (obj) => {
  const exports = { a: 1, b: 2 };

  const descriptors = Object.getOwnPropertyDescriptors(exports);
  Object.defineProperties(obj, descriptors);

  console.warn(`obj.a`, obj.a);

  return /** @type {A & B} */ (Object.freeze(obj));
};

setTimeout(() => {
  console.log(cb.x === 3, cb);

  const mcb2 = mergeExports(cb2);

  const { x, a, b } = mcb2;
  console.log(mcb2.a === 1, { x, a, b });
}, 50);
