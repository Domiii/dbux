import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';

/** @typedef {import('../PathwayDataProvider').default} PathwayDataProvider */

/** @extends {CollectionIndex<TestRun>} */
export default class TestRunByBugIdIndex extends CollectionIndex {
  constructor() {
    super('testRuns', 'byBugId', { stringKey: true });
  }

  /** 
   * @param {PathwayDataProvider} pdp
   * @param {TestRun} testRun
   */
  makeKey(pdp, testRun) {
    return testRun.bugId;
  }
}