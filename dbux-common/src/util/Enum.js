/**
 * Enum class
 */
export default class Enum {
  constructor(namesOrValuesByNames) {
    const valuesByNames = this.makeEnumObject(namesOrValuesByNames);
    this.valuesByNames = Object.freeze(valuesByNames);
    this.names = Object.keys(valuesByNames);
    this.values = Object.values(valuesByNames);

    // store reverse lookup
    const namesByValues = {};
    this.names.forEach(name => namesByValues[valuesByNames[name]] = name);
    this.namesByValues = Object.freeze(namesByValues);

    for (const name in valuesByNames) {
      if (this[name] !== undefined) {
        throw new Error('Invalid name in enum already used by Enum class: ' + name);
      }
      this[name] = valuesByNames[name];
    }
  }

  get is() {
    if (!this._is) {
      // first time access of `is`
      this._is = this._makeIs();
    }
    return this._is;
  }

  _makeIs() {
    return new Proxy({}, {
      has: (target, name) => {
        let cb = target[name];
        return cb !== undefined;
      },

      get: (target, name) => {
        let cb = target[name];
        if (name === Symbol.toStringTag) { return this.names.toString(); }
        if (cb === undefined) {
          // first time access of `is[name]`
          const value = this.valueFromForce(name);
          cb = target[name] = this.isValue.bind(this, value);
        }
        return cb;
      },

      ownKeys: () => {
        return this.names;
      },

      enumerate: function () {
        return this.names;
      }
    });
  }

  /**
   * @virtual
   */
  isValue(value, nameOrValue) {
    return value === this.valueFrom(nameOrValue);
  }

  get byName() {
    return this.valuesByNames;
  }

  getCount() {
    return this.names.length;
  }

  /**
   * plus one to make creating array of length `maxValueIndex + 1` convenient
   */
  getValueMaxIndex() {
    return Math.max(...this.values) + 1;
  }

  getName = (value) => {
    return this.namesByValues[value];
  }

  getValue = (name) => {
    return this.valuesByNames[name];
  }

  /**
   * Will get the value, no matter if you give it a name or a value
   */
  valueFrom = (nameOrValue) => {
    let value = this.getValue(nameOrValue);
    if (value !== undefined) {
      return value;
    }
    else {
      const name = this.getName(nameOrValue);
      return (name !== undefined ? nameOrValue : this.getValue(nameOrValue));
    }
  }

  /**
   * Throws an error if given parameter is not a valid value or name.
   */
  valueFromForce = (nameOrValue) => {
    const value = this.valueFrom(nameOrValue);
    if (value === undefined) {
      throw new Error(`Invalid name or value: ${nameOrValue} (enum = ${JSON.stringify(this.valuesByNames)})`);
    }
    return value;
  }

  /**
   * Will get the value, no matter if you give it a name or a value.
   * @returns {string}
   */
  nameFrom = (nameOrValue) => {
    let name = this.getName(nameOrValue);
    if (name !== undefined) {
      return name;
    }
    else {
      const value = this.getValue(nameOrValue);
      return (value !== undefined ? nameOrValue : this.getName(nameOrValue));
    }
  }

  /**
   * Throws an error if given parameter is not a valid value or name
   */
  nameFromForce = (nameOrValue) => {
    const value = this.nameFrom(nameOrValue);
    if (value === undefined) {
      debugger;
      throw new Error(`Invalid name or value: ${nameOrValue} (enum = ${JSON.stringify(this.valuesByNames)})`);
    }
    return value;
  }

  // ###########################################################################
  // previous + next
  // ###########################################################################

  previousValue(value) {
    const { values } = this;
    let idx = values.indexOf(value);
    idx = (idx - 1) % values.length;
    return values[idx];
  }

  nextValue(value) {
    const { values } = this;
    let idx = values.indexOf(value);
    idx = (idx + 1) % values.length;
    return values[idx];
  }

  // ###########################################################################
  // switchCall
  // ###########################################################################

  // call function from a set of functions, based on given input
  switchCall(valueOrName, functions, ...args) {
    const name = this.nameFromForce(valueOrName);

    const cb = functions[name];
    if (!functions[name]) {
      throw new Error(`${this.constructor.name}.switchCall() failed: functions does not contain property "${name}"`);
    }
    if (!(cb instanceof Function)) {
      throw new Error(`${this.constructor.name}.switchCall() failed: functions["${name}"] is not a function`);
    }
    return cb(...args);
  }

  // ###########################################################################
  // isAnyOf
  // ###########################################################################

  isAnyOf(targetValueOrName, namesString) {
    const names = namesString.split(' ');
    if (names.length === 0) {
      throw new Error(`no names given to ${this}.isAnyOf`);
    }
    const searchName = this.nameFromForce(targetValueOrName);
    return names.includes(searchName);
  }

  // ###########################################################################
  // utilities
  // ###########################################################################


  makeEnumObject(namesOrValuesByNames) {
    if (!Array.isArray(namesOrValuesByNames)) {
      return namesOrValuesByNames;
    }
    else {
      return this.makeSimpleEnumObject(namesOrValuesByNames);
    }
  }

  /**
   * @virtual
   */
  makeSimpleEnumObject(names) {
    return Object.fromEntries(
      names.map((name, i) => [name, i + 1])
    );
  }
}


/** Some tests

const assert = console.assert;

const enum1 = new Enum({a: 1, b: 2});

assert(enum1.getName(1) === 'a');
assert(enum1.getName(2) === 'b');
assert(enum1.getValue('a') === 1);
assert(enum1.getValue('b') === 2);
assert(enum1.byName.a === 1);

assert(enum1.valueFromForce(1) === 1);
assert(enum1.valueFromForce('b') === 2);
assert(enum1.nameFromForce('b') === 'b');
assert(enum1.nameFromForce(1) === 'a');


*/