import Enum from '@dbux/common/src/util/Enum';


// eslint-disable-next-line import/no-mutable-exports
let UserActionType = {
  PracticeSessionChanged: 1,
  TestRunFinished: 2,
  NewBugProgress: 3,
  BugProgressChanged: 4,

  EditorEvent: 10,
  
  SelectTrace: 11,
  TagTrace: 12,

  OtherTreeViewEvent: 20,
  OtherTreeViewCollapseChangeEvent: 21,
  TDNavigation: 22,
  TDValueClick: 23,
  TDValueCollapseChange: 24,
  TDTrackObjectUse: 25,
  TDObjectUse: 26,
  TDExecutionsUse: 27,
  TDTraceUse: 30,

  TDDebugUse: 31,

  OtherCallGraphEvent: 100,
  CallGraphSetting: 101,
  CallGraphSearch: 102,
  CallGraphNodeCollapseChange: 103,
  CallGraphNodeClick: 104,
  CallGraphNodeValClick: 105,
  CallGraphNodeCallClick: 106,
  CallGraphNodeLocClick: 107
};

UserActionType = new Enum(UserActionType);

const majorAction = new Array(UserActionType.getValueMaxIndex()).map(() => false);
majorAction[UserActionType.SelectTrace] = true;
majorAction[UserActionType.TagTrace] = true;
majorAction[UserActionType.Navigation] = true;
majorAction[UserActionType.CallGraphEvent] = true;

/**
 * Actions the user usually does purposefully as part of their investigation.
 * Excludes status updates and editor events.
 */
export function isMajorAction(actionType) {
  return majorAction[actionType];
}

export default UserActionType;