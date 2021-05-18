
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
    return this.node.stack.Verbose;
  }

  debug(...args) {
    return this.node.stack.debug(' >', ...args);
  }

  warn(...args) {
    return this.node.stack.warn(' >', ...args);
  }

  get debugTag() {
    return this.toString();
  }

  toString() {
    return `[${this.constructor.name}] ${this.node}`;
  }
}