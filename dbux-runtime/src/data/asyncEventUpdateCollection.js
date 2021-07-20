// import '@dbux/common/src/types/AsyncEventUpdate';
import { PreAwaitUpdate, PostAwaitUpdate, PreThenUpdate, PostThenUpdate } from '@dbux/common/src/types/AsyncEventUpdate';
import AsyncEventUpdateType from '@dbux/common/src/types/constants/AsyncEventUpdateType';
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
   * @return {PreAwaitUpdate}
   */
  addPreAwaitUpdate(upd) {
    upd.type = AsyncEventUpdateType.PreAwait;
    this._addUpdate(upd);
    return upd;
  }

  /**
   * @return {PostAwaitUpdate}
   */
  addPostAwaitUpdate(upd) {
    upd.type = AsyncEventUpdateType.PostAwait;
    this._addUpdate(upd);
    return upd;
  }

  /**
   * @return {PreThenUpdate}
   */
  addPreThenUpdate(upd) {
    upd.type = AsyncEventUpdateType.PreThen;
    this._addUpdate(upd);
    return upd;
  }

  /**
   * @return {PostThenUpdate}
   */
  addPostThenUpdate(upd) {
    upd.type = AsyncEventUpdateType.PostThen;
    this._addUpdate(upd);
    return upd;
  }
}

const asyncEventUpdateCollection = new AsyncEventUpdateCollection();

export default asyncEventUpdateCollection;