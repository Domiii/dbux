import Enum from '@dbux/common/src/util/Enum';
import UserActionType from './UserActionType';


// eslint-disable-next-line import/no-mutable-exports
let ActionGroupType = {
  SelectTrace: 1,
  TagTrace: 2,
  TDValue: 23,
  TDTrackObject: 25,
  TDExecutions: 26,
  TDTrackObjectTrace: 27,
  TDExecutionsTrace: 28,
  TDTrace: 30,
  
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

  CallGraphSelectTrace: 20,
  CallGraphSearch: 21,
  CallGraphTrace: 22,
  CallGraphOther: 23,

  // gear icon
  Other: 50,

  Hidden: 60
};

ActionGroupType = new Enum(ActionGroupType);


const groupByType = {
  [UserActionType.EditorEvent]: ActionGroupType.Hidden,
  [UserActionType.SelectTrace]: ActionGroupType.SelectTrace,
  [UserActionType.TagTrace]: ActionGroupType.TagTrace,
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
  [UserActionType.CallGraphOther]: ActionGroupType.CallGraphOther,
  [UserActionType.CallGraphSetting]: ActionGroupType.CallGraphOther,
  [UserActionType.CallGraphSearch]: ActionGroupType.CallGraphSearch,
  [UserActionType.CallGraphNodeCollapseChange]: ActionGroupType.CallGraphOther,
  [UserActionType.CallGraphTrace]: ActionGroupType.CallGraphTrace,
  [UserActionType.CallGraphCallTrace]: ActionGroupType.CallGraphTrace
};

export function getGroupTypeByActionType(actionType) {
  return groupByType[actionType] || ActionGroupType.Other;
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
