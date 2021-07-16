import AsyncEventUpdate from '@dbux/common/src/types/AsyncEventUpdate';
import Collection from '../Collection';

var x = new AsyncEventUpdate();
x.

/**
 * @extends {Collection<AsyncEventUpdate>}
 */
export default class AsyncEventUpdateCollection extends Collection {
  constructor(dp) {
    super('asyncEventUpdates', dp);
  }
}