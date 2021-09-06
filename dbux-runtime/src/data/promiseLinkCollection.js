import PromiseLink from '@dbux/common/src/types/PromiseLink';
import Collection from './Collection';
import pools from './pools';

/**
 * @type {Collection<PromiseLink>}
 */
class PromiseLinkCollection extends Collection {
  constructor() {
    super('promiseLinks');
  }

  addLink(fromPromiseId, toPromiseId, traceId) {
    const entry = pools.promiseLinks.allocate();

    entry.linkId = entry._id = this._all.length;
    this.push(entry);

    entry.from = fromPromiseId;
    entry.to = toPromiseId;
    entry.traceId = traceId;

    this._send(entry);

    return entry;
  }
}

const promiseLinkCollection = new PromiseLinkCollection();

export default promiseLinkCollection;
