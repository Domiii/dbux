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
}
