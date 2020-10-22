import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';

/** @typedef {import('../PathwayDataProvider').default} PathwayDataProvider */

/** @extends {CollectionIndex<UserAction>} */
export default class StepsByGroupIndex extends CollectionIndex {
  constructor() {
    super('steps', 'byGroup');
  }

  /** 
   * @param {PathwayDataProvider} pdp
   * @param {UserAction} step
   */
  makeKey(pdp, step) {
    return step.stepGroupId;
  }
}