import PromiseLink from '@dbux/common/src/types/PromiseLink';
import Collection from '../Collection';

/**
 * @extends {Collection<PromiseLink>}
 */
export default class NestedPromiseCollection extends Collection {
  constructor(dp) {
    super('promiseLinks', dp, true);

    // NOTE: this collection is not populated by `runtime`
    this._all.push(null);
  }
}