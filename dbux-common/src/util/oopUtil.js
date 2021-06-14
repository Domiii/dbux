import reverse from 'lodash/reverse';

/**
 * @example ```
 * class A { static x = 3; }
 * class B extends A { static x = 55; }
 * console.log(getAllStaticPropsInInheritanceChain(B, 'x')); // [55, 3]
 * ```
 * 
 * @return {[]} Array of all static props of given name in inheritance chain of given class.
 */
export function getAllStaticPropsInInheritanceChain(Clazz, propName) {
  const res = [];
  let Prev = null;
  let Cur = Clazz;
  do {
    if (propName in Cur) {
      const val = Cur[propName];
      if (!Prev || val !== Prev[propName]) {
        // NOTE: if base class does not define the prop, this will access the extending class prop
        res.push(val);
      }
    }
    // Prev = Clazz;
    Prev = Cur;
    Cur = Object.getPrototypeOf(Cur);
    // console.log(' static recurse', Cur?.name, Cur?.[propName], '--', Prev.name);
  }
  while (Cur);

  // reverse result (so deepest comes first)
  return reverse(res);
}


/**
 * @see https://stackoverflow.com/questions/18939192/how-to-test-if-b-is-a-subclass-of-a-in-javascript-node
 */
export function isSubClassOf(Clazz, SubClazz) {
  return Clazz.prototype instanceof SubClazz || Clazz === SubClazz;
}