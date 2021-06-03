import AsyncEvent from '@dbux/common/src/core/data/AsyncEvent';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** 
 * @param {RuntimeDataProvider} dp
 * @param {AsyncEvent} asyncEvent
 */
function makeKey(dp, { fromRun }) {
  return fromRun;
}


/** @extends {CollectionIndex<AsyncEvent>} */
export default class AsyncEventsByFromIndex extends CollectionIndex {
  constructor() {
    super('asyncEvents', 'byFrom');
  }

  makeKey = makeKey;
}