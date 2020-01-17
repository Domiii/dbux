function main() {
  var a = [33, 4, -14, -34, 14, 0, 999];
  var o = {
    p: {
      q: {
        b: []
      },
      x: 3
    }
  };
  var o2 = { y: 4 };
  var o3 = { p: { z: 5 } };
  var o4 = { p: { q: { w: 5 } } };
  var c = [];
  for (let i = 1; i < Math.max(a.length, o.p.q.b.length); ++i) {
    o.p.q.b.push(a[i - 1] * a[i]);
    c.push(o.p.q.b[i - 1] + a[i]);
    o2.y *= i;
    o3.p.z *= i;
    o4.p.q.w *= i;
  }
  console.log(Math.max(...o.p.q.b));
  debugger;
}

main();