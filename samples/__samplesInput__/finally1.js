async function f() {
  try {
    return await 0;
  }
  finally {
    await 1;
  }
}

f();