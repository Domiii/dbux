/**
 * class: getters + constructorless inheritance
 */
'use strict';

class A { }
class B extends A { }

class ABSTRACT { }

class STRING extends ABSTRACT {
  get BINARY() {
    return this._binary = true;
  }

  static get BINARY() {
    return new this().BINARY;
  }
}

console.log(new STRING().BINARY);
console.log(STRING.BINARY);