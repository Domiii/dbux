/**
 * @file
 */


/**
 * 
 */
export class DataAccess {
  /**
   * Refers to `ValueRef`, if this node represents access to a reference type (object, array, function etc.).
   * Else null.
   */
  refId;
  dataPath;
}

export class InvolvedNode extends DataAccess {
  staticTraceId;
}

export class DataBaseNode extends DataAccess {
  nodeId;

  /**
   * The trace that recorded this `DataNode`.
   */
  traceId;

  /**
   * Is `true` if this node:
   * * created a new value (if instanceof DataReadNode) or
   * * modified an existing value (if instanceof DataWriteNode)
   * @type {boolean}
   */
  change;

  // /**
  //  * TODO: future work?
  //  * Used in case of hierarchical data access in a single instruction.
  //  * Probably only used in destructuring and function calls.
  //  * Function call: Parent is `CallExpression` logging data access of the function itself. Children are arguments.
  //  */
  // parentId;

  /**
   * Involved variables are read during an operation, but not otherwise concerned:
   * @example nested `MemberExpression`: `o.a` has [`o`] and `p.c.d` has [`p`, `p.c`]
   * 
   * @type {InvolvedNode[]}
   */
  involved;
}

/**
 *
 *
 * TODO: add destructuring and other many-to-many data operations
 * * `let { a, b: [x,y] } = o` has [`a`, `b`, ]
 */
export class DataReadNode extends DataBaseNode {
}

export class DataWriteNode extends DataBaseNode {
  /**
   * This is an array of either (i) `DataReadNode` or (ii) simple `DataAccess` (in case of `Identifier`?)
   * @type {[]}
   */
  inputs;
}