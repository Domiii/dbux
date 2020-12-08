function f() {
  new Promise(() => { console.log('promise 1')})
}

function g() {
  f()
  new Promise(() => {})
  f()
}

function h() {
  g()
  new Promise(() => {})
  f()
}

f()
g()
h()

console.log('fin')