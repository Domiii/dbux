
class C {
  f() {
    return new Promise(r => setTimeout(() => r('meow'), 100));
  }

  g() {
    return this.f().then(x => console.log(`${x} ${x}`));
  }
}

async function main() {
  const c = new C();
  await c.g();
}

main();