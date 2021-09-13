
function f() {
  return new Promise((resolve) => setTimeout(() => resolve('hi'), 100))
    .then(x => console.log('promise then', x));
}

f().then(() => console.log('done'));