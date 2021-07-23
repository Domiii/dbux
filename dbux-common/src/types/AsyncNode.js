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
   * Aka "schedulerThreadId".
   * The `threadId` of the trace that lead to the scheduling that ultimately lead to creation of this node.
   * @type {number}
   */
  traceId;

  /**
   * @type {number}
   */
  applicationId;
}
