import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';

/** @typedef {import('../ProgressLogController').default} ProgressLogController */

/** @extends {CollectionIndex<UserAction>} */
export default class UserActionByTypeIndex extends CollectionIndex {
  constructor() {
    super('userActions', 'byType');
  }

  /** 
   * @param {ProgressLogController} plc
   * @param {UserAction} userAction
   */
  makeKey(plc, userAction) {
    return userAction.type;
  }
}