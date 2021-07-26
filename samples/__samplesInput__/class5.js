'use strict';

class A {}

class B extends A { }

class STRING extends ABSTRACT {
  get BINARY() {
    this._binary = true;
    this.options.binary = true;
    return this;
  }

  static get BINARY() {
    return new this().BINARY;
  }
}