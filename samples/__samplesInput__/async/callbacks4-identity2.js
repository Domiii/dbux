function cb() {
}
function cb2() {
}

const wm = new WeakMap();

wm.set(cb, 1);
wm.set(cb2, 2);

console.log(wm.has(cb));
