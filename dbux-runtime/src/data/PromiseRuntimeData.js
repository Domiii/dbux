export default class PromiseRuntimeData {
  /**
   * Unique identifier.
   */
  id;

  /**
   * `currentVirtualRootContextId` in which promise was created (or first recorded).
   */
  rootId;

  /**
   * If promise is return value of `async` function: last `currentVirtualRootContextId` in which the function executed.
   * Else: same as `rootId`.
   */
  lastRootId;
  threadId;

  /**
   * If promise is return value of `async` function,
   * this stores the function call's `contextId`.
   */
  asyncFunctionContextId;


  /**
   * Post-event `rootId` of the first event of the promise.
   */
  firstEventRootId;

  /**
   * `traceId` of the first nesting event.
   * Is not set, if promise was created in a different rootId as the nesting event.
   */
  firstNestingTraceId;
}
