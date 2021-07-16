import ExecutionContextType from '../constants/ExecutionContextType';

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
   * @type {number}
   */
  runId;
  
  /**
   * @type {number}
   */
  parentContextId ;
  
  /**
   * @type {number}
   */
  parentTraceId;
  
  /**
   * @type {number}
   */
  contextId ;
  
  /**
   * @type {number}
   */
  staticContextId ;
  
  /**
   * @type {number}
   */
  orderId ;
  
  /**
   * @type {number}
   */
  schedulerTraceId ;
  
  /**
   * @type {number}
   */
  createdAt;
  
  /**
   * @type {number}
   */
  lastTraceId;

  /**
   * This is probably not necessary.
   * We can also find all children by searching for all contexts whose `schedulerId` equals this' `contextId`.
   */
  // addScheduledChild(scheduledContextId) {
  //   // this.scheduledChildren = this.scheduledChildren || [];
  //   // this.scheduledChildren.push(scheduledContextId);
  // }

  /**
   * @type {Number}
   */
  promiseId;

  /**
   * @type {Number}
   */
  threadId;
}