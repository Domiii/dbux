import { newLogger } from '@dbux/common/src/log/logger';
import Enum from '@dbux/common/src/util/Enum';
import UserActionType from './UserActionType';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('StepType');

// eslint-disable-next-line import/no-mutable-exports
let StepType = {
  None: 1,
  Trace: 2,
  CallGraph: 3,
  Search: 4,
  Other: 5
};

const stepByActionType = {
  [UserActionType.EditorSelectionChanged]: StepType.Other,
  [UserActionType.EditorVisibleRangeChanged]: StepType.None,
  [UserActionType.TagTrace]: StepType.Trace,

  [UserActionType.SelectTrace]: StepType.Trace,
  [UserActionType.ShowError]: StepType.Trace,
  [UserActionType.TDValueClick]: StepType.Trace,
  [UserActionType.TDValueCollapseChange]: StepType.Trace,
  [UserActionType.TDTrackObjectUse]: StepType.Trace,
  [UserActionType.TDTrackObjectTraceUse]: StepType.Trace,
  [UserActionType.TDExecutionsUse]: StepType.Trace,
  [UserActionType.TDExecutionsTraceUse]: StepType.Trace,
  [UserActionType.TDTrace]: StepType.Trace,
  [UserActionType.NavigationPreviousInContext]: StepType.Trace,
  [UserActionType.NavigationPreviousChildContext]: StepType.Trace,
  [UserActionType.NavigationPreviousParentContext]: StepType.Trace,
  [UserActionType.NavigationNextInContext]: StepType.Trace,
  [UserActionType.NavigationNextChildContext]: StepType.Trace,
  [UserActionType.NavigationNextParentContext]: StepType.Trace,
  [UserActionType.NavigationPreviousStaticTrace]: StepType.Trace,
  [UserActionType.NavigationNextStaticTrace]: StepType.Trace,
  [UserActionType.NavigationPreviousTrace]: StepType.Trace,
  [UserActionType.NavigationNextTrace]: StepType.Trace,
  [UserActionType.SearchContexts]: StepType.Search,
  [UserActionType.SearchTraces]: StepType.Search,
  [UserActionType.SearchValues]: StepType.Search,
  [UserActionType.CallGraphOther]: StepType.CallGraph,
  [UserActionType.CallGraphNodeCollapseChange]: StepType.CallGraph,
  [UserActionType.CallGraphTrace]: StepType.Trace,
  [UserActionType.CallGraphCallTrace]: StepType.Trace,
  [UserActionType.SessionFinished]: StepType.SessionFinished
};

// Verbose sanity checks for debugging purposes.
// make sure, every ActionType is accounted for
// const missingActions = UserActionType.values.filter(action => !(action in stepByActionType));
// if (missingActions.length) {
//   const missingStr = missingActions.map(action => UserActionType.nameFrom(action)).join(', ');
//   warn(`Missing UserActionTypes in stepByActionType: ${missingStr}`);
// }


export function getStepTypeByActionType(actionType) {
  return stepByActionType[actionType] || StepType.None;
}

StepType = new Enum(StepType);

export default StepType;