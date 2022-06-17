// import UserActionType from '@dbux/data/src/pathways/UserActionType';
import ActionGroupType from '@dbux/data/src/pathways/ActionGroupType';
import StepType from '@dbux/data/src/pathways/StepType';
// import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import { newLogger } from '@dbux/common/src/log/logger';
import { makeStructuredRandomColor } from '@dbux/graph-common/src/shared/contextUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('renderSettings');

const labelsByActionGroupType = {
  [ActionGroupType.SelectTrace]: 'SelectTrace',
  [ActionGroupType.TagTrace]: 'TagTrace',
  [ActionGroupType.ShowError]: 'ShowError',
  [ActionGroupType.TDValue]: 'TDValue',
  [ActionGroupType.TDTrackObject]: 'TDTrackObject',
  [ActionGroupType.TDExecutions]: 'TDExecutions',
  [ActionGroupType.TDTrackObjectTrace]: 'TDTrackObjectTrace',
  [ActionGroupType.TDExecutionsTrace]: 'TDExecutionsTrace',
  [ActionGroupType.TDTrace]: 'TDTrace',
  [ActionGroupType.NavigationPreviousInContext]: 'NavigationPreviousInContext',
  [ActionGroupType.NavigationPreviousChildContext]: 'NavigationPreviousChildContext',
  [ActionGroupType.NavigationPreviousParentContext]: 'NavigationPreviousParentContext',
  [ActionGroupType.NavigationNextInContext]: 'NavigationNextInContext',
  [ActionGroupType.NavigationNextChildContext]: 'NavigationNextChildContext',
  [ActionGroupType.NavigationNextParentContext]: 'NavigationNextParentContext',
  [ActionGroupType.NavigationPreviousStaticTrace]: 'NavigationPreviousStaticTrace',
  [ActionGroupType.NavigationNextStaticTrace]: 'NavigationNextStaticTrace',
  [ActionGroupType.NavigationPreviousTrace]: 'NavigationPreviousTrace',
  [ActionGroupType.NavigationNextTrace]: 'NavigationNextTrace',
  [ActionGroupType.CallGraphSelectTrace]: 'CallGraphSelectTrace',
  [ActionGroupType.Search]: 'SearchContexts',
  [ActionGroupType.CallGraphSelectTrace]: 'CallGraphTrace',
  [ActionGroupType.CallGraphOther]: 'CallGraphOther',
  [ActionGroupType.Other]: 'Other'
};

const defaultActionGroupIcon = 'gear.svg';

const iconsByActionGroupType = {
  [ActionGroupType.TagTrace]: 'flag.svg',
  [ActionGroupType.ShowError]: 'fire.svg',
  [ActionGroupType.AnnotateTraceQ]: 'q.svg',
  [ActionGroupType.AnnotateTraceI]: 'i.svg',
  [ActionGroupType.EditorSelectionChanged]: 'cursor_click.svg',

  [ActionGroupType.SelectTrace]: 'crosshair_red.svg',
  [ActionGroupType.TDValue]: 'project.svg',
  [ActionGroupType.TDTrackObject]: 'object.svg',
  [ActionGroupType.TDExecutions]: 'traceExecutions.svg',
  [ActionGroupType.TDTrackObjectTrace]: 'objectTrace.svg',
  [ActionGroupType.TDExecutionsTrace]: 'traceExecutionTrace.svg',
  [ActionGroupType.TDTrace]: 'crosshair.svg',

  [ActionGroupType.NavigationPreviousInContext]: 'previousInContext.svg',
  [ActionGroupType.NavigationPreviousChildContext]: 'previousChildContext.svg',
  [ActionGroupType.NavigationPreviousParentContext]: 'previousParentContext.svg',
  [ActionGroupType.NavigationNextInContext]: 'nextInContext.svg',
  [ActionGroupType.NavigationNextChildContext]: 'nextChildContext.svg',
  [ActionGroupType.NavigationNextParentContext]: 'nextParentContext.svg',
  [ActionGroupType.NavigationPreviousStaticTrace]: 'previousStaticTrace.svg',
  [ActionGroupType.NavigationNextStaticTrace]: 'nextStaticTrace.svg',
  [ActionGroupType.NavigationPreviousTrace]: 'leftArrow.svg',
  [ActionGroupType.NavigationNextTrace]: 'rightArrow.svg',
  [ActionGroupType.CallGraphSelectTrace]: 'callGraphSelectTrace.svg',
  [ActionGroupType.CallGraphToggleContextNode]: 'listItem.svg',
  [ActionGroupType.CallGraphOther]: defaultActionGroupIcon,
  [ActionGroupType.Search]: 'magnifier.svg',
  [ActionGroupType.Other]: defaultActionGroupIcon,
  [ActionGroupType.Hidden]: ' ',
  [ActionGroupType.SessionFinished]: 'end.svg'
};

const iconsByStepType = {
  [StepType.None]: defaultActionGroupIcon,
  [StepType.Trace]: 'crosshair_red.svg',
  [StepType.CallGraph]: 'dependency.svg',
  [StepType.Search]: 'magnifier.svg',
  [StepType.Other]: 'cursor_click.svg',
};

/**
 * Check that all types have icons
 */
for (const typeName of ActionGroupType.names) {
  if (!iconsByActionGroupType[ActionGroupType[typeName]]) {
    warn(`icon setting for ActionGroupType.${typeName} not found`);
  }
}

export function getLabelByActionGroupType(actionGroupType) {
  return labelsByActionGroupType[actionGroupType] || '(unknown)';
}

export function getIconByActionGroup(actionGroupType) {
  const file = iconsByActionGroupType[actionGroupType] || defaultActionGroupIcon;
  // const file = 'nextInContext.svg';
  return file;
}

export function getIconByStep(stepType) {
  return iconsByStepType[stepType];
}

export function makeStepBackground(step, themeMode) {
  const { staticContextId } = step;
  return staticContextId ? makeStructuredRandomColor(themeMode, staticContextId) : '';
}
