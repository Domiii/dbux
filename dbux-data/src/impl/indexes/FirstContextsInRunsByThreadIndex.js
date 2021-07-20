import EmptyObject from '@dbux/common/src/util/EmptyObject';
import CollectionIndex from '../../indexes/CollectionIndex';

/** @typedef {import('@dbux/common/src/types/ExecutionContext').default} ExecutionContext */
/** @typedef {import('../../RuntimeDataProvider').default} RuntimeDataProvider */

/** @extends {CollectionIndex<ExecutionContext>} */
export default class FirstContextsInRunsByThreadIndex extends CollectionIndex {
  constructor() {
    super('executionContexts', 'firstsInRunsByThread');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {ExecutionContext} context
   */
  makeKey(dp, context) {
    // const { runId, threadId } = context;
    // const lastContextInThread = this.getLast(threadId);
    // if (!lastContextInThread) {
    //   return threadId;
    // }
    // if (lastContextInThread.runId !== runId) {
    //   return threadId;
    // }

    // TODO
    return false;
  }
}