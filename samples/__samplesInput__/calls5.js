
let i = 0;

f(++i);
f(i++);
f(i > 1 ? 'a' : 'b');
f(i > 1 ? i-3 : (i+3));
f(i);
f(i + 3);
f(i.toString);
f(f(i));



function f(...args) { console.log(...args); }