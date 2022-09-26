class CBBarrier {
  constructor(n) {
    this.n = n;
    this.waiting = [];
  }
  enter(notify) {
    this.waiting.push(notify);
    const { waiting, n } = this;
    if (waiting.length === n) {
      setTimeout(() => {
        this.waiting.forEach(
          cb => cb()
        );
      }, 100);
    }
  }
}

function f1(id) {
  console.log('f1', id);
  barrier.enter(f2.bind(null, id));
}

function f2(id) {
  console.log('f2', id);
}

let barrier;

(function main() {
  barrier = new CBBarrier(3);

  setTimeout(() => f1('A'), 200);
  setTimeout(() => f1('B'), 400);
  setTimeout(() => f1('C'), 600);
})();