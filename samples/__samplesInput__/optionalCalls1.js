var a = { 
  f() {
    console.log(`a.f`);
  }
};

a.f();

a.x?.();
a.f?.();
