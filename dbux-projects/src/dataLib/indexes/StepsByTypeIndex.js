import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';

/** @typedef {import('../PathwayDataProvider').default} PathwayDataProvider */

/** @extends {CollectionIndex<Step>} */
export default class StepsByTypeIndex extends CollectionIndex {
  constructor() {
    super('steps', 'byType');
  }

  /** 
   * @param {PathwayDataProvider} pdp
   * @param {Step} step
   */
  makeKey(pdp, step) {
    return step.type;
  }
}