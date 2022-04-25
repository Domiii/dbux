import PromiseLinkType from '@dbux/common/src/types/constants/PromiseLinkType';
import PromiseLink from '@dbux/common/src/types/PromiseLink';
import Collection from '../Collection';

/**
 * @extends {Collection<PromiseLink>}
 */
export default class PromiseLinkCollection extends Collection {
  constructor(dp) {
    super('promiseLinks', dp, { hasNoRuntime: true });
    this._all.push(null);
  }

  /**
   * @param {PromiseLink[]} entries 
   */
  postAddRaw(entries) {
    const { util } = this.dp;
    for (const entry of entries) {
      if (!PromiseLinkType.is.AsyncReturn(entry.type) || !entry.traceId || !!entry.to) {
        continue;
      }
      /**
       * hackfix: for AsyncReturn links without `to`: look up caller promise
       *    → If called async function is also thenCb, there is no BCE, and thus
       *      → postThen and traceCallPromiseResult both call `setAsyncContextPromise` to provide the promiseId.
       */

      const realContext = util.getRealContextOfTrace(entry.traceId);
      const promiseId = realContext?.data?.callerPromiseId;
      // const realContextId = util.getRealContextIdOfTrace(entry.traceId);
      // const bceTrace = realContextId && util.getOwnCallerTraceOfContext(realContextId);
      // // const resultTraceId = bceTrace && util.getBCEResultTraceId(bceTrace.traceId);
      // const promiseRef = bceTrace && util.getTraceValueRef(bceTrace.traceId);
      // const promiseId = promiseRef?.refId;

      if (!promiseId) {
        // TODO: fix `then(async function() {})` in `promisePatcher`!!!
        // NOTE: we can't get the promiseId of an async function that was called by the system
        this.logger.warn(`Could not resolve "to" for PromiseLink at trace (${this.dp.util.makeTraceInfo(entry.traceId)}):`, JSON.stringify(entry, null, 2));
      }
      else {
        entry.to = promiseId;
      }
    }
  }
  
  /**
   * @param {PromiseLink[]} entries 
   */
  postIndexRaw(entries) {
    const { util } = this.dp;
    for (const entry of entries) {
      if (!entry.traceId) {
        // hackfix: in case of PromisifyPromise, `traceId` is not set
        entry.traceId = util.getFirstTraceIdByRefId(entry.from);
      }
    }
  }
}
