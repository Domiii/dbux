export default class AsyncNode {
  /**
   * @type {number}
   */
  asyncNodeId;
  /**
   * @type {number}
   */
  rootContextId;
  /**
   * @type {number}
   */
  threadId;

  /**
   * @type {number}
   */
  threadLaneId;

  /**
   * @type {boolean}
   */
  isTerminalNode;

  // /**
  //  * @type {number}
  //  */
  // traceId;

  /**
   * The `threadId` of the trace that lead to the scheduling that ultimately lead to creation of this node.
   * @type {number}
   */
  schedulerTraceId;

  /**
   * @type {number}
   */
  applicationId;

  /**
   * Assigned for `toRootId` in `setNodeThreadId`
   * @type {number | number[]}
   */
  syncPromiseIds;
}
