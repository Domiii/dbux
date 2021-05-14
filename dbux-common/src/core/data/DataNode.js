/**
 * @file
 */


/**
 * 
 */
export class VarAccess {
  /**
   * Id of the trace of variable declaration/binding (or first recorded instance of variable).
   * Is `null` if accessing a nested object member.
   */
  varId;
  /**
   * Id of the trace of object creation (or first recorded instance of object).
   * Is `null` if accessing a non-reference/-object type.
   */
  refId;
  /**
   * The name of the property accessed within an object.
   * Is `null` if accessing a variable that is not a `MemberExpression`.
   * 
   * @type {string}
   */
  memberPath;
}

export default class DataNode {
  /**
   * The trace that recorded this `DataNode`.
   */
  traceId;

  /**
   * TODO: varAccessId - (i) bindingTraceId, (ii) object refId
   * TODO: varAccessME - (i) bindingTraceId + pathString, (ii) object refId
   * @type {VarAccess}
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