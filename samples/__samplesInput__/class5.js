/**
 * class: getters + constructorless inheritance
 */
'use strict';

class A {}
class B extends A { }

class STRING extends ABSTRACT {
  get BINARY() {
    this._binary = true;
  }

  static get BINARY() {
    return new this().BINARY;
  }
}