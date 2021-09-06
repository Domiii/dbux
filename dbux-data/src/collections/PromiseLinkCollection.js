import PromiseLink from '@dbux/common/src/types/PromiseLink';
import Collection from '../Collection';

/**
 * @extends {Collection<PromiseLink>}
 */
export default class PromiseLinkCollection extends Collection {
  constructor(dp) {
    super('promiseLinks', dp, true);
    this._all.push(null);
  }
}
