import { NodePath } from '@babel/traverse';
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

/**
 * NOTE: only assignments can have ME LVals
 */
function isLValME(node) {
  const { path: p } = node;
  return p.parentPath.isAssignment() && p.node === p.parentPath.node.id;
}

class MemberElement {
  /**
   * @type {NodePath}
   */
  path;
  /**
   * @type {boolean}
   */
  computed;

  /**
   * @type {boolean}
   */
  optional;

  constructor(path, computed, optional) {
    this.path = path;
    this.computed = computed;
    this.optional = optional;
  }
}

export default class MemberExpression extends BaseNode {
  static visitors = [
    'MemberExpression',
    'OptionalMemberExpression'
  ];
  static children = ['object', 'property'];
  static plugins = [
    [isLValME, 'MELVal'],
    [(node) => !isLValME(node), 'MERVal']
  ];

  /**
   * Don't create separate MEs if nested.
   */
  static shouldCreateOnEnter(path/* , state */) {
    return !path.parentPath.isMemberExpression() || path.node === path.parentPath.node.property;
  }

  /**
   * All `MemberElements` of MemberExpression chain left-to-right order.
   * 
   * @type {array<MemberElement>}
   */
  chain = [];

  // ###########################################################################
  // enter + exit
  // ###########################################################################

  exitNested(path) {
    this._anyExit(path);
  }

  exit() {
    this._anyExit(this.path);
  }

  _anyExit(path) {
    if (!this.chain.length) {
      // inner-most ME is exited first; has leftId
      this.chain.push(
        new MemberElement(path.get('object'), false, false)
      );
    }

    // NOTE: property is required
    const {
      computed, optional
    } = path.node;
    this.chain.push(
      new MemberElement(path.get('property'), computed, optional)
    );
  }

  // enter() {
  //   //     if (objPath.isSuper()) {
  //   //       // Do nothing. We already take care of this via `instrumentMemberCallExpressionEnter`.
  //   //       // return traceBeforeSuper(objPath, state);
  //   //       return null;
  //   //     }
  // }


  // ###########################################################################
  // exit
  // ###########################################################################

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
     * TODO: store `declarationTid`, `refTid` for `a`
     * TODO: store `memberPath`, `memberRefTid` for nested MEs (`a.b`, `b.c`, `c.d`, `o.x` (== `d.x`))
     */
  }
}
