
class DataAccess {
  /**
   * Refers to `ValueRef`, if this node represents access to a reference type (object, array, function etc.).
   * Else null.
   */
  refId;
  varPath;
}

class InvolvedNode extends DataAccess {
  staticTraceId;
}

/**
 *
 *
 * TODO: add destructuring and other many-to-many data operations
 * * `let { a, b: [x,y] } = o` has [`a`, `b`, ]
 */
export default class DataNode extends DataAccess {
  nodeId;

  /**
   * The trace that recorded this `DataNode`.
   */
  traceId;

  /**
   * Whether this is an lVal (write; receiver of data) or not (read).
   * For example, LHS of assignments or variable declarations are lvals. Also, function parameters.
   * LVals can only be `Identifier`, `MemberExpression`, `{Object,Array}Pattern`
   * @type {boolean}
   */
  lVal;

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