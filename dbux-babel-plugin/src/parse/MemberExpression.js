import BaseExpression from './BaseExpression';

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

  exit(object, property, [objectPath, propertyPath]) {
    const {
      dynamicIndexes,
      template,
      path
    } = this;

    const { computed/* , optional */ } = path.node;

    // inner-most ME is exited first; has left-most id
    if (!this.leftId) {
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
  }


  // ###########################################################################
  // gen
  // ###########################################################################

  instrument(staticData, state) {
    // TODO: instrument
  }

  genStaticTrace(state, staticId) {
    const { template, dynamicIndexes } = this;
    return {
      template,
      dynamicIndexes
    };
  }
}
