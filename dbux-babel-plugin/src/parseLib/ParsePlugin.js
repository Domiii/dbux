
/** @typedef { import("./ParseNode").default } ParseNode */

export default class ParsePlugin {
  /**
   * @type {ParseNode}
   */
  node;

  // ###########################################################################
  // debugging
  // ###########################################################################

  get Verbose() {
    return this.stack.Verbose;
  }

  debug(...args) {
    return this.stack.debug(' >', ...args);
  }

  get debugTag() {
    return this.toString();
  }

  toString() {
    return `[${this.constructor.name}] ${this.node}`;
  }
}