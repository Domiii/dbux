/**
 * @deprecated
 */
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
   * If promise is return value of `async` function: `lastRootId` is corresponding last recorded `resumeContext` id.
   * Else: `undefined`
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
   * `traceId` of the first event that nests the promise.
   * Is not set, if promise was created in a different rootId as the nesting event.
   */
  firstNestingTraceId;

  /**
   * @type {Promise}
   * 
   * This promise is the return value of calling `then`ish on `preThenPromise`.
   */
  preThenPromise;

  /**
   * The first promise whose `then`ish callback returned this promise.
   */
  firstNestedBy;
}
