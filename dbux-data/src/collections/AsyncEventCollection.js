import AsyncEvent from '@dbux/common/src/types/AsyncEvent';
import Collection from '../Collection';

/**
 * @extends {Collection<AsyncEvent>}
 */
export default class AsyncEventCollection extends Collection {
  constructor(dp) {
    super('asyncEvents', dp);
  }
}