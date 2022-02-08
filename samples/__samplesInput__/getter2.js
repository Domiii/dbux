
const o = {};

console.log(o.propA);

o.__defineGetter__('propA', () => 'A');

console.log(o.propA);