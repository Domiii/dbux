

export function getAllStaticPropsInInheritanceChain(Clazz, propName) {
  const res = [];
  // let Prev = null;
  let Cur = Clazz;
  do {
    if (propName in Cur) {
      res.push(Cur[propName]);
    }
    // Prev = Clazz;
    Cur = Object.getPrototypeOf(Cur);
    // console.log(Prev, Cur);
  }
  while (Cur);
  return res;
}

// class A { static x = 3; }
// class B extends A { static x = 55; }
// console.log(getAllStaticPropsInInheritanceChain(B, 'x'));