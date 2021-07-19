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

  runId;

  rootId;

  /**
   * For `PreAwait`: Resume context during which `await` was called.
   * For `PostAwait`: Resume context that was pushed as result of this `await`.
   * For `PreThen`: Context during which `then` was called.
   * For `PostThen`: Context of the `then` callback.
   */
  contextId;

  /**
   * uniquely identifies the event.
   */
  schedulerTraceId;
}

// ###########################################################################
// Async
// ###########################################################################

export class AsyncFunctionUpdate extends AsyncUpdateBase {
  /** @type {number} */
  realContextId;
  returnPromiseId;
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
  /**
   * For PreThen: the promise on which `then` was called.
   * For PostThen: the promise returned by `then`.
   */
  promiseId;
}

export class PreThenUpdate extends PromiseUpdate {
  nestedPromiseId;
}

export class PostThenUpdate extends PromiseUpdate {
}



/**
 * NOTE: Since `implements` has not been updated for ES6 yet, we have to use `typedef` here.
 *    Consider asyncEventUpdateCollection for usage example.
 * @see https://github.com/jsdoc/jsdoc/issues/1537
 * 
 * @typedef {(AsyncCallUpdate | PreAwaitUpdate | PostAwaitUpdate | PreThenUpdate | PostThenUpdate)} AsyncEventUpdate
 */