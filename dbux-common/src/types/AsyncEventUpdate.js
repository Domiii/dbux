import AsyncEventUpdateType from '../constants/AsyncEventUpdateType';

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
}

// ###########################################################################
// Async
// ###########################################################################

export class AsyncFunctionUpdate extends AsyncUpdateBase {
  realContextId;
}

export class AsyncCallUpdate extends AsyncFunctionUpdate {
  promiseId;
}

export class PreAwaitUpdate extends AsyncFunctionUpdate {
  /** @type {number} */
  realContextId;

  resumeContextId;

  nestedPromiseId;

  traceId;
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