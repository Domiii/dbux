import AsyncEventUpdateType from './constants/AsyncEventUpdateType';

export class AsyncUpdateBase {
  updateId;

  /**
   * @type {AsyncEventUpdateType[keyof AsyncEventUpdateType]}
   *
   * NOTE: ValueOf typing
   * @see https://stackoverflow.com/questions/49285864/is-there-a-valueof-similar-to-keyof-in-typescript
   */
  type;

  rootId;

  /**
   * For `preAwait`: Resume context during which `await` was called.
   * For `postAwait`: Resume context that was pushed as result of this `await`.
   * For `preThen`: Context during which `then` was called.
   * For `postThen`: Context of the `then` callback.
   */
  contextId;
}

// ###########################################################################
// Async
// ###########################################################################

export class AsyncFunctionUpdate extends AsyncUpdateBase {
  /**
   * uniquely identifies the event.
   */
  schedulerTraceId;

  /** @type {number} */
  realContextId;
}

// export class AsyncCallUpdate extends AsyncFunctionUpdate {
//   callId;
//   promiseId;
// }

export class PreAwaitUpdate extends AsyncFunctionUpdate {
  nestedPromiseId;
}

export class PostAwaitUpdate extends AsyncFunctionUpdate {
}

// ###########################################################################
// Promise
// ###########################################################################

export class PromiseUpdate extends AsyncUpdateBase {
  promiseId;
}

export class PreThenUpdate extends PromiseUpdate {
  nestedPromiseId;

  /**
   * uniquely identifies the event.
   */
  schedulerTraceId;
}

export class PostThenUpdate extends PromiseUpdate {
  /**
   * uniquely identifies the event.
   */
  schedulerTraceId;
}



/**
 * NOTE: Since `implements` has not been updated for ES6 yet, we have to use `typedef` here.
 *    Consider asyncEventUpdateCollection for usage example.
 * @see https://github.com/jsdoc/jsdoc/issues/1537
 * 
 * @typedef {(AsyncCallUpdate | PreAwaitUpdate | PostAwaitUpdate | PreThenUpdate | PostThenUpdate)} AsyncEventUpdate
 */