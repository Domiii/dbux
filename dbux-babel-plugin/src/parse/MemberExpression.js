import BaseExpression from './BaseExpression';

/**
 * TODO
 * 
 * 1. track all read access (lval or rval), for each read o[x]:
 *    * VarRead(o): referenceId + path
 *    * VarRead(x): referenceId (if it has any) + path [if x is not constant]
 *    * VarRead(o[x]): referenceId (if it has any) + path
 * 2. track write access on final write o[x] = y
 *   * 
 */



/** @typedef {import('@babel/types/lib').Identifier} Identifier */

export default class MemberExpression extends BaseExpression {
  /**
   * @example `o` in `o.a[x].b.c[y]`
   * @type {Identifier}
   */
  leftId;
  template = [];
  dynamicIndexes = [];
  // staticNodes = [];
  // dynamicNodes = [];

  // init() {
  // }


  // ###########################################################################
  // enter
  // ###########################################################################

  static shouldCreateOnEnter(path/* , state */) {
    return !path.parentPath.isMemberExpression() || path.node === path.parentPath.node.property;
  }

  enter() {
  }


  // ###########################################################################
  // exit
  // ###########################################################################

  static nodeNames = ['object', 'property'];

  exit(object, property, [objectPath, propertyPath]) {
    const {
      dynamicIndexes,
      template,
      path
    } = this;

    const { computed/* , optional */ } = path.node;

    if (!this.leftId) {
      // inner-most ME is exited first; has leftId
      this.leftId = objectPath.node;
      template.push(objectPath.toString());
    }

    // TODO: optional

    if (computed) {
      dynamicIndexes.push(template.length);
      template.push(null);
    }
    else {
      template.push(propertyPath.toString());
    }

    // TODO: only return on final exit
    return {
      template,
      dynamicIndexes
    };
  }


  // ###########################################################################
  // gen
  // ###########################################################################

  instrument(staticData, state) {
    // TODO: instrument
  }
}
