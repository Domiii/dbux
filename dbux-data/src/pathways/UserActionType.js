import Enum from '@dbux/common/src/util/Enum';


const UserActionTypeObj = {
  PracticeSessionChanged: 1,
  TestRunFinished: 2,
  NewExerciseProgress: 3,
  ExerciseProgressChanged: 4,

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
  TDAsyncUse: 32,
  GlobalDebugAppUse: 33,
  GlobalConsoleUse: 34,
  GlobalProgramsUse: 35,
  
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

  DataFlowViewSearchModeChanged: 60,
  DataFlowViewFilterModeChanged: 61,
  DataFlowSelectTrace: 65,
  
  SearchModeChanged: 90,
  SearchContexts: 91,
  SearchTraces: 92,
  SearchValues: 93,

  CallGraphOther: 100,
  CallGraphNodeCollapseChange: 101,
  CallGraphTrace: 102,
  CallGraphCallTrace: 103,

  SessionFinished: 110
};

/**
 * @type {(Enum|typeof UserActionTypeObj)}
 */
const UserActionType = new Enum(UserActionTypeObj);


export default UserActionType;

const codeActionTypes = new Array(UserActionType.getValueMaxIndex()).map(() => false);
codeActionTypes[UserActionType.EditorSelectionChanged] = true;
codeActionTypes[UserActionType.EditorVisibleRangeChanged] = true;

export function isCodeActionTypes(actionType) {
  return codeActionTypes[actionType];
}