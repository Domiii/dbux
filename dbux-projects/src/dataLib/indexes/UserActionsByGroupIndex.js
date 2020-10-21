import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';

/** @typedef {import('../PathwayDataProvider').default} PathwayDataProvider */

/** @extends {CollectionIndex<UserAction>} */
export default class UserActionsByGroupIndex extends CollectionIndex {
  constructor() {
    super('userActions', 'byGroup');
  }

  /** 
   * @param {PathwayDataProvider} pdp
   * @param {UserAction} userAction
   */
  makeKey(pdp, userAction) {
    return userAction.groupId;
  }
}