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

  addLink(type, fromPromiseId, toPromiseId, traceId, rootId, asyncPromisifyPromiseId = 0) {
    const entry = pools.promiseLinks.allocate();

    entry.linkId = entry._id = this._all.length;
    this.push(entry);

    entry.type = type;
    entry.from = fromPromiseId;
    entry.to = toPromiseId;
    entry.traceId = traceId;
    entry.rootId = rootId;
    entry.asyncPromisifyPromiseId = asyncPromisifyPromiseId;

    this._send(entry);

    return entry;
  }
}

const promiseLinkCollection = new PromiseLinkCollection();

export default promiseLinkCollection;
