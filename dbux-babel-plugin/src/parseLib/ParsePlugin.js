/** @typedef { import("./ParseNode").default } ParseNode */


// /**
//  * @template N
//  */
export default class ParsePlugin {
  // /** @typedef {ParseNode | N} _ParseNodeType */
  // /**
  //  * @type {_ParseNodeType}
  //  */
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

  error(...args) {
    return this.node.logger.error(`[${this}]`, ...args);
  }

  get debugTag() {
    return this.toString();
  }

  toString() {
    return `[${this.constructor.name}] ${this.node}`;
  }
}