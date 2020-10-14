function f1(a, b) {
    return a + b;
}

function f2(...c) {
    console.log(c);
}

function f3(a, b = 7122, c = f1, ...d) {
    return b + c(5, 6);
}

f1(3, 4);
f1(5, 6, 7, 8);

f2('q', 'w', 7122);

f3(5);