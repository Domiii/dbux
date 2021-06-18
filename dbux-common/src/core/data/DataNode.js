/**
 * @file
 */
/** @typedef { import("../constants/DataNodeType").default } DataNodeType */


/**
 * VarAccess of an `Identifier`.
 */
export class VarAccessId {
  /**
   * Tid of variable declaration/binding (or first recorded instance of variable).
   */
  declarationTid;
}

/**
 * VarAccess of a `MemberExpression`.
 */
export class VarAccesME {
  /**
   * Tid of object being accessed.
   * NOTE: We can get variable `declarationTid` as well as `refId` through this.
   */
  objectTid;

  /**
   * The property string.
   * 
   * @type {string}
   */
  prop;
}

export default class DataNode {
  nodeId;

  /**
   * The trace that recorded this `DataNode`.
   */
  traceId;

  /**
   * @type {DataNodeType}
   */
  type;

  /**
   * Id of object's `ValueRef`.
   * Is `0` when accessing a non-reference/-object type.
   */
  refId;

  /**
   * @type {VarAccessId | VarAccessME | null}
   */
  varAccess;

  /**
   * An id that uniquely identifies variable access:
   * (i) Either a single variable (`declarationTid`), or
   * (ii) a property of an object (makeUid(`${getValueIdentity(objectTid)}#${prop}`)).
   * 
   * NOTE: computed in post-processing.
   * @type {number}
   */
  accessId;

  /**
   * An id that uniquely identifies this "value":
   * (i) Either object (for which we use `refId`) or
   * (ii) non-reference type (see `slicing.md`).
   * 
   * NOTE: computed in post-processing.
   * @type {number}
   */
  valueId;

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