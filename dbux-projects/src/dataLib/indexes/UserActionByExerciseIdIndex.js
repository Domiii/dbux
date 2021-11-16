import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';

/** @typedef {import('../PathwaysDataProvider').default} PathwaysDataProvider */

/** @extends {CollectionIndex<UserAction>} */
export default class UserActionByExerciseIdIndex extends CollectionIndex {
  constructor() {
    super('userActions', 'byExerciseId', { isMap: true });
  }

  /** 
   * @param {PathwaysDataProvider} pdp
   * @param {UserAction} userAction
   */
  makeKey(pdp, userAction) {
    return userAction.exerciseId;
  }
}