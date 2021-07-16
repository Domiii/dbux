// import '@dbux/common/src/types/AsyncEventUpdate';
import { AsyncCallUpdate, PreAwaitUpdate, PostAwaitUpdate, PreThenUpdate, PostThenUpdate } from '@dbux/common/src/types/AsyncEventUpdate';
import Collection from './Collection';
import pools from './pools';

/** @typedef { import("@dbux/common/src/types/AsyncEventUpdate").AsyncEventUpdate } AsyncEventUpdate */


export class AsyncEventUpdateCollection extends Collection {
  constructor() {
    super('asyncEventUpdates');
  }

  _addUpdate(upd) {
    upd.updateId = this._all.length;
    this.push(upd);
    this._send(upd);
  }

  /**
   * @return {AsyncCallUpdate}
   */
  addAsyncCallUpdate() {
    const upd = pools.addAsyncCallUpdates.allocate();

    // upd. = ;

    this._addUpdate(upd);

    return upd;
  }

  /**
   * @return {PreAwaitUpdate}
   */
  addPreAwaitUpdate() {
    const upd = pools.preAwaitUpdates.allocate();

    // upd. = ;

    this._addUpdate(upd);

    return upd;
  }

  /**
   * @return {PostAwaitUpdate}
   */
  addPostAwaitUpdate() {
    const upd = pools.postAwaitUpdates.allocate();

    // upd. = ;

    this._addUpdate(upd);

    return upd;
  }

  /**
   * @return {PreThenUpdate}
   */
  addPreThenUpdate() {
    const upd = pools.preThenUpdates.allocate();

    // upd. = ;

    this._addUpdate(upd);

    return upd;
  }

  /**
   * @return {PostThenUpdate}
   */
  addPostThenUpdate() {
    const upd = pools.postThenUpdates.allocate();

    // upd. = ;

    this._addUpdate(upd);

    return upd;
  }
}

const asyncEventUpdateCollection = new AsyncEventUpdateCollection();

export default asyncEventUpdateCollection;