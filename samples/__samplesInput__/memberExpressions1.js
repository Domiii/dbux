
const a = 'a1';

const p = { a };
const o = {
  b: {
    [p.a]: {
      c: 'qwe'
    }
  }
}

console.log(o.b[p.a].c);
