/** @typedef { import("./constants/SpecialIdentifierType").default } SpecialIdentifierType */
/** @typedef { import("./constants/SpecialDynamicTraceType").default } SpecialDynamicTraceType */

export class TracePurposeInfo {
  type;

  // more context-sensitive data here
}

export class TraceData {
  /**
   * only: BCE.
   * traceId of the callee.
   */
  calleeTid;

  /**
   * only: BCE.
   * @type {number[]}
   */
  argTids;

  /**
   * only: BCE.
   */
  spreadLengths;

  /**
   * only: BCE.
   * Assigned in case of `call`, `apply`, `bind` etc.
   */
  calledFunctionTid;

  /**
   * only: BCE.
   * 
   * Contains custom data generated by monkey-patched built-ins.
   */
  monkey;

  /**
   * Statically determined special properties of a trace.
   * 
   * Currently only set in `BaseId` and `MemberExpression`.
   * We do not set it for constants, whose `TraceType` already encodes the same information (e.g. `super`, `this`, etc.).
   * 
   * TODO: replace with `purpose`
   * 
   * {@link SpecialIdentifierType}
   */
  specialType;

  /**
   * Dynamically determined special properties of a trace.
   * 
   * TODO: replace with `purpose`
   * 
   * {@link specialDynamicTraceType}
   */
  specialDynamicType;
}


export default class Trace {
  /**
   * @type {number}
   */
  traceId;
  /**
   * @type {number}
   */
  staticTraceId;
  /**
   * @type {number}
   */
  applicationId;
  /**
   * @type {number}
   */
  runId;
  /**
   * NOTE: this is the **virtual** rootContextId.
   * @type {number}
   */
  rootContextId;
  /**
   * @type {number}
   */
  contextId;

  /**
   * @type {number}
   */
  nodeId;
  // /**
  //  * @type {number}
  //  */
  // loopId;

  /**
   * This is currently only set for `Pop` traces (to enable error tracking).
   * @type {number}
   */
  previousTrace;

  /**
   * Set in post, on `Pop` traces which were not preceded by a context-ending trace.
   * @type {boolean}
   */
  error;

  /**
   * @type {TracePurposeInfo[]}
   */
  purposes;

  /**
   * NOTE: this is the dynamic type only.
   *       Use DataProvider.util.getTraceType to get actual TraceType.
   * @type {number}
   */
  type;

  /**
   * Extra data related to this trace, based on circumstances.
   * @type {TraceData}
   */
  data;
}