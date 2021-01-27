import Enum from '@dbux/common/src/util/Enum';


// eslint-disable-next-line import/no-mutable-exports
let UserActionType = {
  PracticeSessionChanged: 1,
  TestRunFinished: 2,
  NewBugProgress: 3,
  BugProgressChanged: 4,

  GoToError: 8,
  EditorSelectionChanged: 9,
  EditorVisibleRangeChanged: 10,
  
  SelectTrace: 11,
  TagTrace: 12,
  AnnotateTraceQ: 13,
  AnnotateTraceI: 14,

  TreeViewOther: 20,
  TreeViewCollapseChangeOther: 21,
  TDValueClick: 23,
  TDValueCollapseChange: 24,
  TDTrackObjectUse: 25,
  TDTrackObjectTraceUse: 26,
  /**
   * Collapse/expand "Executions xN"
   */
  TDExecutionsUse: 27,
  /**
   * Select a trace under "Executions xN"
   */
  TDExecutionsTraceUse: 28,
  TDTraceUse: 30,

  TDDebugUse: 31,
  
  NavigationPreviousInContext: 40,
  NavigationPreviousChildContext: 41,
  NavigationPreviousParentContext: 42,
  NavigationNextInContext: 43,
  NavigationNextChildContext: 44,
  NavigationNextParentContext: 45,
  NavigationPreviousStaticTrace: 46,
  NavigationNextStaticTrace: 47,
  NavigationPreviousTrace: 48,
  NavigationNextTrace: 49,

  CallGraphOther: 100,
  CallGraphSearchContexts: 102,
  CallGraphSearchTraces: 103,
  CallGraphNodeCollapseChange: 104,
  CallGraphTrace: 105,
  CallGraphCallTrace: 106,

  SessionFinished: 110
};

UserActionType = new Enum(UserActionType);


export default UserActionType;

const codeActionTypes = new Array(UserActionType.getValueMaxIndex()).map(() => false);
codeActionTypes[UserActionType.EditorSelectionChanged] = true;
codeActionTypes[UserActionType.EditorVisibleRangeChanged] = true;

export function isCodeActionTypes(actionType) {
  return codeActionTypes[actionType];
}