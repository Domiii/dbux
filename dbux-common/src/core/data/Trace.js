import HasValue from './HasValue';

export default class Trace extends HasValue {
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
   * @type {number}
   */
  contextId;
  /**
   * @type {number}
   */
  loopId;

  /**
   * This is currently only set for `Pop` traces (to enable error tracking).
   * @type {number}
   */
  previousTrace;

  /**
   * NOTE: this is the dynamic type only.
   *       Use DataProvider.util.getTraceType to get actual TraceType.
   * @type {number}
   */
  type;
}