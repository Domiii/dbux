import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';
import BugProgress from '../BugProgress';

/** @typedef {import('../PathwayDataProvider').default} PathwayDataProvider */

/** @extends {CollectionIndex<BugProgress>} */
export default class BugProgressByBugIdIndex extends CollectionIndex {
  constructor() {
    super('bugProgresses', 'byBugId', { stringKey: true });
  }

  /** 
   * @param {PathwayDataProvider} pdp
   * @param {BugProgress} bugProgress
   */
  makeKey(pdp, bugProgress) {
    return bugProgress.bugId;
  }
}