import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';

/** @typedef {import('../PathwayDataProvider').default} PathwayDataProvider */

/** @extends {CollectionIndex<UserAction>} */
export default class UserActionsByStepIndex extends CollectionIndex {
  constructor() {
    super('userActions', 'byStep');
  }

  /** 
   * @param {PathwayDataProvider} pdp
   * @param {UserAction} userAction
   */
  makeKey(pdp, userAction) {
    return userAction.stepId;
  }
}