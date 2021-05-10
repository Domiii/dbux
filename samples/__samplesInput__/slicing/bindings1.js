function f(x) {
  console.log(x);
}

// const x = 0;
// f(x);
const w = 6;

for (var i = 0; i < 10; ++i) {
  const y = 4;
  setTimeout(() => {
    f(i, y);
    function g() {
      var x = 3;
      f(x, w);
      h();
    }
    g();
  }, 100);
}
for (let j = 0; j < 10; ++j) {
  setTimeout(() => f(j), 100);
}

function h() {}

