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
   * For PreAwait + PostAwait: the return value of the async function.
   * For PreThen: the promise on which `then` was called.
   * For PostThen: the promise returned by `then`.
   * 
   * NOTE: for async function - collected in `postAddRaw`.
   */
  promiseId;


  /**
   * For PreAwait + PostAwait: promiseId of the await argument (if it is a promise).
   * For PreThen + PostThen: promiseId of the value returned from `then` callback (if it is a promise).
   */
  nestedPromiseId;

  /**
   * For PreAwait: Resume context during which `await` was called.
   * For PostAwait: Resume context that was pushed as result of this `await`.
   * For PreThen: Context during which `then` was called.
   * For PostThen: Context of the `then` callback.
   */
  contextId;

  /**
   * Uniquely identifies the event.
   * 
   * For PreAwait + PostAwait: trace of the AwaitExpression.
   * For PreThen + PostThen: callId of the `then` CallExpression's.
   */
  schedulerTraceId;
}

// ###########################################################################
// Async
// ###########################################################################

export class AsyncFunctionUpdate extends AsyncUpdateBase {
  /** @type {number} */
  realContextId;
}

// export class AsyncCallUpdate extends AsyncFunctionUpdate {
//   callId;
//   promiseId;
// }

export class PreAwaitUpdate extends AsyncFunctionUpdate {
}

export class PostAwaitUpdate extends AsyncFunctionUpdate {
}


// ###########################################################################
// Promise
// ###########################################################################

export class PromiseUpdate extends AsyncUpdateBase {
}

export class PreThenUpdate extends PromiseUpdate {
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