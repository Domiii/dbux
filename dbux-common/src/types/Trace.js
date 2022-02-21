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
   */
  monkey;
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