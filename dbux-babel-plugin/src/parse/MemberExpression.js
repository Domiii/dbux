import BaseNode from './BaseNode';

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

export default class MemberExpression extends BaseNode {
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

  // enter() {
  //   //   MemberProperty(propertyPath, state) {
  //   //     const path = propertyPath.parentPath;
  //   //     if (path.node.computed) {
  //   //       return enterExpression(TraceType.ExpressionValue, propertyPath, state);
  //   //     }
  //   //     return null;
  //   //   },

  //   //   MemberObject(objPath, state) {
  //   //     if (objPath.isSuper()) {
  //   //       // Do nothing. We already take care of this via `instrumentMemberCallExpressionEnter`.
  //   //       // return traceBeforeSuper(objPath, state);
  //   //       return null;
  //   //     }
  //   //     else {
  //   //       // trace object (e.g. `x` in `x.y`) as-is
  //   //       return enterExpression(TraceType.ExpressionValue, objPath, state, null, false);
  //   //     }
  //   //   },
  // }


  // ###########################################################################
  // exit
  // ###########################################################################

  static children = ['object', 'property'];

  // exit() {
  //   //   MemberProperty(propertyPath, state) {
  //   //     const path = propertyPath.parentPath;
  //   //     if (path.node.computed) {
  //   //       return wrapExpression(TraceType.ExpressionValue, propertyPath, state);
  //   //     }
  //   //     return null;
  //   //   },

  //   //   MemberObject(objPath, state) {
  //   //     if (objPath.isSuper()) {
  //   //       // nothing to do here
  //   //       return null;
  //   //     }
  //   //     else {
  //   //       // trace object (e.g. `x` in `x.y`) as-is
  //   //       wrapExpression(TraceType.ExpressionValue, objPath, state, null, false);

  //   //       // NOTE: the `originalPath` is not maintained
  //   //       return null;
  //   //     }
  //   //   },
  //   const [objectPath, propertyPath] = this.getChildPaths();

  //   const {
  //     dynamicIndexes,
  //     template,
  //     path
  //   } = this;

  //   const { computed/* , optional */ } = path.node;
  //   // TODO: `optional`

  //   if (!this.leftId) {
  //     // inner-most ME is exited first; has leftId
  //     this.leftId = objectPath.node;
  //     template.push(objectPath.toString());
  //   }

  //   if (computed) {
  //     dynamicIndexes.push(template.length);
  //     template.push(null);
  //   }
  //   else {
  //     template.push(propertyPath.toString());
  //   }

  //   // TODO: only return on final exit
  //   return {
  //     template,
  //     dynamicIndexes
  //   };
  // }


  // ###########################################################################
  // gen
  // ###########################################################################

  instrument(staticData, state) {
    // TODO: need instrumentNestedMELval (see `instrumentMemberCallExpressionEnter`)
    /**
     * var a = { b: { c: { d: { x: 3 } }}}
     * var o;
     * ((o = a.b.c.d), o.x)
     *
     * 
     * TODO: store `varTid`, `refTid` for `a`
     * TODO: store `memberPath`, `memberRefTid` for nested MEs (`a.b`, `b.c`, `c.d`, `o.x` (== `d.x`))
     */
  }
}
