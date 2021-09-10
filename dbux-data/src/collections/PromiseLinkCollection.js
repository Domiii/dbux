import PromiseLinkType from '@dbux/common/src/types/constants/PromiseLinkType';
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

  postIndexRaw(entries) {
    const { util } = this.dp;
    for (const entry of entries) {
      if (!PromiseLinkType.is.AsyncReturn(entry.type) || !entry.traceId || !!entry.to) {
        // fix those links that need fixing
        continue;
      }

      // fix up "async return" links (establish `to` promise)
      const realContextId = util.getRealContextIdOfTrace(entry.traceId);
      const bceTrace = realContextId && util.getOwnCallerTraceOfContext(realContextId);
      // const resultTraceId = bceTrace && util.getBCEResultTraceId(bceTrace.traceId);
      const promiseRef = bceTrace && util.getTraceValueRef(bceTrace.traceId);
    
      entry.to = promiseRef.refId;

      if (!entry.to) {
        // TODO: fix `then(async function() {})` in `promisePatcher`!!!
        // NOTE: we can't get the promiseId of an async function that was called by the system
        this.logger.warn(`Could not resolve "to" for PromiseLink (${this.dp.util.makeTraceInfo(entry.traceId)}):`, entry);
      }
    }
  }
}
