import ExecutionContextType from './constants/ExecutionContextType';

// TODO: the following code won't work with webpack since webpack runs in node, gathering all dependencies; would need more configuration parameters
// let _performance;
// if (typeof performance !== 'undefined') {
//   // browser
//   _performance = performance;
// }
// else {
//   // node
//   _performance = require('perf_hooks').performance;
// }

export default class ExecutionContext {
  /**
   * @type {ExecutionContextType}
   */
  contextType;

  /**
   * @type {number}
   */
  stackDepth;

  /**
   * @deprecated Use `rootContextId` instead. NOTE: `trace` has it, context did not need it quite yet.
   * @type {number}
   */
  runId;

  /**
   * @type {number}
   */
  parentContextId;

  /**
   * If context was created by a CallExpression: BCE trace.
   * Otherwise: the last trace before the context was pushed.
   * 
   * @type {number}
   */
  parentTraceId;

  /**
   * @type {number}
   */
  applicationId;

  /**
   * @type {number}
   */
  contextId;

  /**
   * @type {number?}
   */
  realContextId;

  /**
   * @type {number}
   */
  staticContextId;

  /**
   * @type {number}
   */
  orderId;

  /**
   * @type {number}
   */
  schedulerTraceId;

  /**
   * @type {number}
   */
  createdAt;

  /**
   * @type {number}
   */
  lastTraceId;

  /**
   * @type {boolean}
   */
  isVirtualRoot;

  // /**
  //  * NOTE: only set if `isVirtualRoot`
  //  * 
  //  * @type {string}
  //  */
  // stackTrace;

  /**
   * If the context is an async function, this is its returned `promiseId`.
   * 
   * @type {number}
   */
  asyncPromiseId;

  /**
   * @type {{callerPromiseId: number}?}
   */
  data;

  /**
   * Set to id of promise whose ctor executor was on stack (if any).
   * 
   * @type {number?}
   */
  promisifyId;
}