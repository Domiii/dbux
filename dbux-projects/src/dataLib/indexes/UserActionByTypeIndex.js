import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';

/** @typedef {import('../PathwayDataProvider').default} PathwayDataProvider */

/** @extends {CollectionIndex<UserAction>} */
export default class UserActionByTypeIndex extends CollectionIndex {
  constructor() {
    super('userActions', 'byType');
  }

  /** 
   * @param {PathwayDataProvider} pdp
   * @param {UserAction} userAction
   */
  makeKey(pdp, userAction) {
    return userAction.type;
  }
}