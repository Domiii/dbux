import { newLogger } from '@dbux/common/src/log/logger';
import Enum from '@dbux/common/src/util/Enum';
import UserActionType from './UserActionType';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ActionGroupType');

// eslint-disable-next-line import/no-mutable-exports
let ActionGroupType = {
  SelectTrace: 1,
  TagTrace: 2,
  AnnotateTraceQ: 3,
  AnnotateTraceI: 4,

  GoToError: 5,

  EditorSelectionChanged: 10,

  TDValue: 11,
  TDTrackObject: 13,
  TDExecutions: 14,
  TDTrackObjectTrace: 15,
  TDExecutionsTrace: 16,
  /**
   * any other trace node
   */
  TDTrace: 17,

  CallGraphSelectTrace: 20,
  CallGraphToggleContextNode: 21,
  CallGraphOther: 22,

  AsyncCallGraphSelectTrace: 26,

  Search: 30,

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

  // gear icon?
  Other: 50,

  Hidden: 60,

  SessionFinished: 70
};

ActionGroupType = new Enum(ActionGroupType);

const groupByActionType = {
  [UserActionType.EditorSelectionChanged]: ActionGroupType.EditorSelectionChanged,
  [UserActionType.EditorVisibleRangeChanged]: ActionGroupType.Hidden,
  [UserActionType.SelectTrace]: ActionGroupType.SelectTrace,
  [UserActionType.TagTrace]: ActionGroupType.TagTrace,
  [UserActionType.AnnotateTraceQ]: ActionGroupType.AnnotateTraceQ,
  [UserActionType.AnnotateTraceI]: ActionGroupType.AnnotateTraceI,
  [UserActionType.GoToError]: ActionGroupType.GoToError,
  [UserActionType.TDValueClick]: ActionGroupType.TDValue,
  [UserActionType.TDValueCollapseChange]: ActionGroupType.TDValue,
  [UserActionType.TDTrackObjectUse]: ActionGroupType.TDTrackObject,
  [UserActionType.TDTrackObjectTraceUse]: ActionGroupType.TDTrackObjectTrace,
  [UserActionType.TDExecutionsUse]: ActionGroupType.TDExecutions,
  [UserActionType.TDExecutionsTraceUse]: ActionGroupType.TDExecutionsTrace,
  [UserActionType.TDTrace]: ActionGroupType.TDTrace,
  [UserActionType.NavigationPreviousInContext]: ActionGroupType.NavigationPreviousInContext,
  [UserActionType.NavigationPreviousChildContext]: ActionGroupType.NavigationPreviousChildContext,
  [UserActionType.NavigationPreviousParentContext]: ActionGroupType.NavigationPreviousParentContext,
  [UserActionType.NavigationNextInContext]: ActionGroupType.NavigationNextInContext,
  [UserActionType.NavigationNextChildContext]: ActionGroupType.NavigationNextChildContext,
  [UserActionType.NavigationNextParentContext]: ActionGroupType.NavigationNextParentContext,
  [UserActionType.NavigationPreviousStaticTrace]: ActionGroupType.NavigationPreviousStaticTrace,
  [UserActionType.NavigationNextStaticTrace]: ActionGroupType.NavigationNextStaticTrace,
  [UserActionType.NavigationPreviousTrace]: ActionGroupType.NavigationPreviousTrace,
  [UserActionType.NavigationNextTrace]: ActionGroupType.NavigationNextTrace,
  [UserActionType.SearchContexts]: ActionGroupType.Search,
  [UserActionType.SearchTraces]: ActionGroupType.Search,
  [UserActionType.SearchValues]: ActionGroupType.Search,
  [UserActionType.CallGraphOther]: ActionGroupType.CallGraphOther,
  [UserActionType.CallGraphNodeCollapseChange]: ActionGroupType.CallGraphToggleContextNode,
  [UserActionType.CallGraphTrace]: ActionGroupType.CallGraphSelectTrace,
  [UserActionType.CallGraphCallTrace]: ActionGroupType.CallGraphSelectTrace,
  
  [UserActionType.AsyncCallGraphTrace]: ActionGroupType.AsyncCallGraphSelectTrace,
  [UserActionType.AsyncCallGraphError]: ActionGroupType.AsyncCallGraphSelectTrace,
  [UserActionType.AsyncCallGraphParent]: ActionGroupType.AsyncCallGraphSelectTrace,
  [UserActionType.AsyncCallGraphScheduler]: ActionGroupType.AsyncCallGraphSelectTrace,
  [UserActionType.AsyncCallGraphValueTrace]: ActionGroupType.AsyncCallGraphSelectTrace,

  [UserActionType.SessionFinished]: ActionGroupType.SessionFinished
};

// make sure, every ActionType is accounted for
const missingActions = UserActionType.values.filter(action => !(action in groupByActionType));
if (missingActions.length) {
  const missingStr = missingActions.map(action => UserActionType.nameFrom(action)).join(', ');
  warn(`Missing UserActionTypes in groupByActionType: ${missingStr}`);
}


export function getGroupTypeByActionType(actionType) {
  return groupByActionType[actionType] || ActionGroupType.Other;
}

const clumpedGroups = new Array(ActionGroupType.getValueMaxIndex()).map(() => false);
clumpedGroups[ActionGroupType.Other] = true;
clumpedGroups[ActionGroupType.Hidden] = true;

export function isGroupTypeClumped(actionGroupType) {
  return clumpedGroups[actionGroupType];
}


export function shouldClumpTogether(oldGroupType, newGroupType) {
  return isGroupTypeClumped(newGroupType) && (newGroupType === oldGroupType || isGroupTypeClumped(oldGroupType));
}

export function isHiddenGroup(groupType) {
  return ActionGroupType.is.Hidden(groupType);
}

export function isHiddenAction(actionType) {
  const groupType = getGroupTypeByActionType(actionType);
  return ActionGroupType.is.Hidden(groupType);
}


export default ActionGroupType;
