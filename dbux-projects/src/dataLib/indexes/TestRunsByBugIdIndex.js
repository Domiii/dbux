import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';

/** @typedef {import('../PathwaysDataProvider').default} PathwaysDataProvider */

/** @extends {CollectionIndex<TestRun>} */
export default class TestRunByBugIdIndex extends CollectionIndex {
  constructor() {
    super('testRuns', 'byBugId', { stringKey: true });
  }

  /** 
   * @param {PathwaysDataProvider} pdp
   * @param {TestRun} testRun
   */
  makeKey(pdp, testRun) {
    return testRun.bugId;
  }
}