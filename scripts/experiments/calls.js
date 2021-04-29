(function main() {
  const o = { x: 1, f() { console.log('x', this.x); } };
  const f = o.f.call.bind();
})();