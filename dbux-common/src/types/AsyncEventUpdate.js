import AsyncEventUpdateType from './constants/AsyncEventUpdateType';

export class AsyncUpdateBase {
  updateId;

  /**
   * @type {AsyncEventUpdateType[keyof AsyncEventUpdateType]}
   */
  type;

  runId;

  rootId;

  /**
   * For PreAwait: Resume context during which `await` was called.
   * For PostAwait: Resume context that was pushed as result of this `await`.
   * For PreThen: Context during which `then` was called.
   * For PostThen: Context of the `then` callback.
   */
  contextId;

  /**
   * For PreAwait + PostAwait: the return value of the async function (collected in `postAddRaw`).
   * For PreThen: the promise on which `then` was called.
   * For PostThen: the promise returned by `then`.
   * For {Pre,Post}Callback: used in case of promisification.
   */
  preEventPromiseId;


  /**
   * For PreAwait: promiseId of the await argument (if it is a promise).
   * For PostThen: promiseId of the value returned from `then` callback (if it is a promise).
   */
  nestedPromiseId;

  /**
   * Uniquely identifies the event.
   * 
   * For PreAwait + PostAwait: trace of the AwaitExpression.
   * For PreThen + PostThen: callId of the `then` CallExpression's.
   */
  schedulerTraceId;

  /**
   * For Post*: records all instances of `resolve`/`reject` being called in the same root.
   * 
   * @type {Array.<ResolveEvent>}
   */
  resolveEvents;

  /**
   * Generally for Pre* and resolve updates only.
   */
  promiseCtorId;
}

// ###########################################################################
// Async
// ###########################################################################

export class AsyncFunctionUpdate extends AsyncUpdateBase {
  /** @type {number} */
  realContextId;
}

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
  postEventPromiseId;
}

export class PostThenUpdate extends PromiseUpdate {
}

// ###########################################################################
// Callbacks
// ###########################################################################

export class PreCallbackUpdate extends AsyncUpdateBase {
  isEventListener;
}

export class PostCallbackUpdate extends AsyncUpdateBase {
  
}



/**
 * NOTE: Since `implements` has not been updated for ES6 yet, we have to use `typedef` here.
 *    Consider asyncEventUpdateCollection for usage example.
 * @see https://github.com/jsdoc/jsdoc/issues/1537
 * 
 * @typedef {(PreAwaitUpdate | PostAwaitUpdate | PreThenUpdate | PostThenUpdate | ResolveUpdate | PreCallbackUpdate | PostCallbackUpdate)} AsyncEventUpdate
 */