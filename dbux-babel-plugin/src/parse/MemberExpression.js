import BaseExpression from './BaseExpression';

/** @typedef {import('@babel/types/lib').Identifier} Identifier */

export default class MemberExpression extends BaseExpression {
  /**
   * @example `o` in `o.a[x].b.c[y]`
   * @type {Identifier}
   */
  leftId;
  chain = [];

  // init() {
  // }

  
  // ###########################################################################
  // enter
  // ###########################################################################

  static shouldCreateOnEnter(path/* , state */) {
    return !path.parentPath.isMemberExpression() || path.node === path.parentPath.node.property;
  }


  // ###########################################################################
  // exit
  // ###########################################################################

  exit(path) {
    // inner-most ME is exited first; has left-most id
    if (!this.leftId) {
      this.leftId = path.node.object;
    }
  }


  // ###########################################################################
  // gen
  // ###########################################################################

  gen(path) {
    // TODO
  }
}