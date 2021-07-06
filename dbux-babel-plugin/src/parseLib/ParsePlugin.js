/** @typedef { import("./ParseNode").default } ParseNode */

import { pathToString } from '../helpers/pathHelpers';


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

  get name() {
    return this.constructor.name;
  }

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
    return this.node.logger.error(`[>${this.name}]`, ...args);
  }

  get debugTag() {
    return this.toString();
  }

  toString() {
    return `[${this.node.nodeTypeName} > ${this.name}] ${pathToString(this.node.enterPath)}`;
  }
}