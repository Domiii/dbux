/**
 * Copies all missing properties from a to b.
 */
function mixin(a, b) {
  for (const name of Object.getOwnPropertyNames(a)) {
    if (!(name in b)) {
      const desc = Object.getOwnPropertyDescriptor(a, name);
      console.debug('mixin', a, name, desc.value);
      Object.defineProperty(b, name, desc);
    }
  }
};

const a = {
  x: 1,
  y() { return 'ay'; }
};
const b = {
  x: 2,
  z() { return 'bz'; }
};

mixin(a, b);

try {
  console.log(b);
  console.log(b.y(), b.z(), '<-> ay bz');
}
catch (err) {
  console.error('FAIL -', err);
}