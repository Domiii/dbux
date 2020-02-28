
function f(x, cb1, cb2) {
    cb1();
    console.log('f', x);
    cb2();
}

function g() {
    console.log('g');
}

function h() {
    console.log('h');
}

function i() {}

f(3, g, h, i); // i is a cb that was never called!


