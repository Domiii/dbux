const o = require('./require0');

let a = '';
const reqPath = './require0' + a;
// reqPath += 're0';
const p = require(reqPath);

console.log(o.a, p.a);