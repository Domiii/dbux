/** @typedef { import("../RuntimeDataProvider").default } RuntimeDataProvider */

export default class Query {
  /** @type {RuntimeDataProvider} */
  dp;
  
  constructor(name, cfg) {
    this.name = name;
    this.cfg = cfg || {};
  }

  get debugName() {
    return this.constructor.name;
  }

  _init(dp) {
    this.dp = dp;
  }

  executor = (dp, args) => this.executeQuery(dp, args);

  /**
   * Execute query on all data.
   */
  executeQuery(dp, args) {
    throw new Error(`abstract method not implemented: ${this}.executeQuery`);
  }

  toString() {
    return `${this.debugName}`;
  }
}