import Enum from '@dbux/common/src/util/Enum';


const UserActionTypeObj = {
  PracticeSessionChanged: 1,
  TestRunFinished: 2,
  NewExerciseProgress: 3,
  ExerciseProgressChanged: 4,
  RunFile: 5,
  RuntimeServerStatusChanged: 6,
  ShowHelp: 7,
  ShowError: 8,
  EditorSelectionChanged: 9,
  EditorVisibleRangeChanged: 10,

  SelectTrace: 11,
  SelectTraceById: 12,
  TagTrace: 13,
  AnnotateTraceQ: 14,
  AnnotateTraceI: 15,

  TreeViewOther: 20,
  TreeViewCollapseChangeOther: 21,
  TDValueClick: 22,
  TDValueCollapseChange: 23,
  TDValueRender: 24,
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
  TDExecutionsGroupModeChanged: 29,
  TDTraceUse: 30,
  TDDebugUse: 31,
  TDAsyncUse: 32,
  TDAsyncGoToForkParent: 33,
  TDAsyncGoToScheduler: 34,

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

  DecorationVisibilityChanged: 70,
  NavBarButtonsVisibilityChanged: 71,
  ErrorLogNotificationVisibilityChanged: 72,

  GlobalDebugAppUse: 80,
  GlobalConsoleUse: 81,
  GlobalProgramsUse: 82,
  GlobalPackageSortModeChanged: 83,

  SearchModeChanged: 90,
  SearchContexts: 91,
  SearchTraces: 92,
  SearchValues: 93,

  CallGraphOther: 100,
  CallGraphNodeCollapseChange: 101,
  CallGraphTrace: 102,
  CallGraphCallTrace: 103,
  CallGraphVisibilityChanged: 104,

  PathwaysVisibilityChanged: 110,

  StopProjectRunner: 120,
  ProjectViewsVisibilityChanged: 121,
  CheckSystem: 122,
  ShowOutputChannel: 123,
  ShowApplicationEntryFile: 124,
  OpenWebsite: 125,
  ShowExerciseIntroductionView: 126,
  NewApplications: 127,

  ProjectViewListModeChanged: 130,

  SessionFinished: 200
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