import UserActionType from '@dbux/data/src/pathways/UserActionType';

/**
 * NOTE: `this` will be refer to pdp
 */

export default {
  1(header, allData) {
    allData.userActions.forEach(action => {
      // set codeEvents
      if (action.type === 10) {
        if (action.eventType === 'selectionChanged') {
          action.type = 9;
        }
        delete action.eventType;
      }
    });

    resolvePathwaysData(this, allData);
  },
  2(header, allData) {
    // hotfix: some logs contains SessionFinished event with no createdAt property
    const { userActions } = allData;
    const lastAction = userActions[userActions.length - 1];
    const isFinished = UserActionType.is.SessionFinished(lastAction.type);
    if (isFinished && !lastAction.createdAt) {
      lastAction.createdAt = userActions[userActions.length - 2].createdAt;
    }
    resolvePathwaysData(this, allData);
  }
};

function resolvePathwaysData(pdp, allData) {
  const actions = allData.userActions;
  delete allData.userActions;
  delete allData.actionGroups;
  delete allData.steps;

  pdp.addData(allData, false);
  actions.forEach(action => {
    pdp.addNewUserAction(action, false);
  });
}