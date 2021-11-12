import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';

/** @typedef {import('../PathwaysDataProvider').default} PathwaysDataProvider */

/** @extends {CollectionIndex<TestRun>} */
export default class TestRunByExerciseIdIndex extends CollectionIndex {
  constructor() {
    super('testRuns', 'byExerciseId', { isMap: true });
  }

  /** 
   * @param {PathwaysDataProvider} pdp
   * @param {TestRun} testRun
   */
  makeKey(pdp, testRun) {
    return testRun.exerciseId;
  }
}