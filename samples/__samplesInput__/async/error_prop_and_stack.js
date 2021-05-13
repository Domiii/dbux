

async function i() { await 0; console.log('i'); }
async function h() { throw new Error(); await i();  }
async function g() { h(); h(); }
async function f() { await g(); console.log('f'); }

f().catch(e => console.log('catch'));