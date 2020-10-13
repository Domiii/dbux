import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';

/** @typedef {import('../PathwaysDataProvider').default} PathwaysDataProvider */

/** @extends {CollectionIndex<UserAction>} */
export default class UserActionByTypeIndex extends CollectionIndex {
  constructor() {
    super('userActions', 'byType');
  }

  /** 
   * @param {PathwaysDataProvider} pdp
   * @param {UserAction} userAction
   */
  makeKey(pdp, userAction) {
    return userAction.type;
  }
}