import CollectionIndex from '@dbux/data/src/indexes/CollectionIndex';
import { isHiddenGroup } from '@dbux/data/src/pathways/ActionGroupType';

/** @typedef {import('../PathwaysDataProvider').default} PathwaysDataProvider */

/** @extends {CollectionIndex<ActionGroup>} */
export default class VisibleActionGroupByStepIdIndex extends CollectionIndex {
  constructor() {
    super('actionGroups', 'visiblesbyStepId');
  }

  /** 
   * @param {PathwaysDataProvider} pdp
   * @param {ActionGroup} actionGroup
   */
  makeKey(pdp, actionGroup) {
    if (isHiddenGroup(actionGroup.type)) {
      return false;
    }
    else {
      return actionGroup.stepId;
    }
  }
}