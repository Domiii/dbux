/**
 * @file
 */


/**
 * VarAccess of an `Identifier`.
 */
export class VarAccessId {
  /**
   * Id of the trace of variable declaration/binding (or first recorded instance of variable).
   * Is `null` when accessing **nested** object member.
   */
  varTid;
}

/**
 * VarAccess of a `MemberExpression`.
 */
export class VarAccesME {
  /**
   * The `traceId` of the object of the ME.
   * NOTE: This is used to connect the two DataNodes of an ME.
   */
  objectTid;

  /**
   * The name of the property accessed within an object.
   * 
   * @type {string}
   */
  memberPath;
}

export default class DataNode {
  nodeId;

  /**
   * The trace that recorded this `DataNode`.
   */
  traceId;

  /**
   * Id of object's `ValueRef`.
   * Is `0` when accessing a non-reference/-object type.
   */
  refId;

  /**
   * @type {VarAccessId | VarAccessME}
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
   * value is set for primitive value type vars
   */
  value;
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