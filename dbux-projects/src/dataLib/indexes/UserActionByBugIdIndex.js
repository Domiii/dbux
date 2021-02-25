import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';

/** @typedef {import('../PathwaysDataProvider').default} PathwaysDataProvider */

/** @extends {CollectionIndex<UserAction>} */
export default class UserActionByBugIdIndex extends CollectionIndex {
  constructor() {
    super('userActions', 'byBugId', { isMap: true });
  }

  /** 
   * @param {PathwaysDataProvider} pdp
   * @param {UserAction} userAction
   */
  makeKey(pdp, userAction) {
    return userAction.bugId;
  }
}