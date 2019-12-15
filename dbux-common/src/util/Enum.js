// Some small utilities to work with enums


export default class Enum {
  constructor(valuesByNames) {
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

  get byName() {
    return this.valuesByNames;
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