const p = new Promise(r => {r()});

async function f() {
  await p;
}

f();

p.then(() => {})