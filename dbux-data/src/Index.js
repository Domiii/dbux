export default class Index<T> {
  name;

  constructor(name) {
    this.name = name;
  }

  /**
   * Returns a unique key (number) for given entry.
   */
  makeKey(dp, entry : T) : number {
    throw new Error(`abstract method not implemented: ${this.constructor.name}.makeKey`);
  }

}