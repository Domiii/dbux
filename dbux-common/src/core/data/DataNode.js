/**
 * @file
 */


/**
 * 
 */
export class VarAccess {
  /**
   * Refers to `ValueRef`, if this node represents access to a reference type (object, array, function etc.).
   * Else null.
   */
  refId;
  dataPath;
}

export class InvolvedNode extends VarAccess {
  staticTraceId;
}

export default class DataNode {
  /**
   * The trace that recorded this `DataNode`.
   */
  traceId;

  /**
   * TODO: varAccessId - (i) bindingTraceId, (ii) object refId
   * TODO: varAccessME - (i) bindingTraceId + pathString, (ii) object refId
   * TODO: varAccessMENested - varAccessME + (iii) involved (array of varAccessME)
   */
  varAccess;

  /**
   * Array of `traceId`, representing incoming edges.
   * @type {number[]}
   */
  inputs;

  // /**
  //  * TODO: future work?
  //  * Used in case of hierarchical data access in a single instruction.
  //  * Probably only used in destructuring and function calls.
  //  * Function call: Parent is `CallExpression` logging data access of the function itself. Children are arguments.
  //  */
  // parentId;

  /**
   * Involved variables are read during an operation (but not otherwise concerned):
   * @example nested `MemberExpression`: `o.a` has [`o`] and `p.c.d` has [`p`, `p.c`]
   * 
   * @type {InvolvedNode[]}
   */
  involved;
}

// /**
//  *
//  *
//  * TODO: add destructuring and other many-to-many data operations
//  * * `let { a, b: [x,y] } = o` has [`a`, `b`, ]
//  */
// export class DataReadNode extends DataNode {
// }

// export class DataWriteNode extends DataNode {
// }