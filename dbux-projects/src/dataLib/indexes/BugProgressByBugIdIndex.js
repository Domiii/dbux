import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';
import BugProgress from '../BugProgress';

/** @typedef {import('../ProgressLogController').default} ProgressLogController */

/** @extends {CollectionIndex<BugProgress>} */
export default class BugProgressByBugIdIndex extends CollectionIndex {
  constructor() {
    super('bugProgresses', 'byBugId', { stringKey: true });
  }

  /** 
   * @param {ProgressLogController} plc
   * @param {BugProgress} bugProgress
   */
  makeKey(plc, bugProgress) {
    return bugProgress.bugId;
  }
}