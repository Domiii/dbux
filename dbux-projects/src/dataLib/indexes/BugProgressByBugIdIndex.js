import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';
import BugProgress from '../BugProgress';

/** @typedef {import('../PathwaysDataProvider').default} PathwaysDataProvider */

/** @extends {CollectionIndex<BugProgress>} */
export default class BugProgressByBugIdIndex extends CollectionIndex {
  constructor() {
    super('bugProgresses', 'byBugId', { isMap: true });
  }

  /** 
   * @param {PathwaysDataProvider} pdp
   * @param {BugProgress} bugProgress
   */
  makeKey(pdp, bugProgress) {
    return bugProgress.bugId;
  }
}