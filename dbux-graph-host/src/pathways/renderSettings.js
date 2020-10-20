// import UserActionType from '@dbux/data/src/pathways/UserActionType';
import ActionGroupType from '@dbux/data/src/pathways/ActionGroupType';
import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('renderSettings');

const labelsByActionGroupType = {
  [ActionGroupType.SelectTrace]: 'SelectTrace',
  [ActionGroupType.TagTrace]: 'TagTrace',
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
  [ActionGroupType.CallGraphSearchContexts]: 'CallGraphSearchContexts',
  [ActionGroupType.CallGraphSearchTraces]: 'CallGraphSearchTraces',
  [ActionGroupType.CallGraphSelectTrace]: 'CallGraphTrace',
  [ActionGroupType.CallGraphOther]: 'CallGraphOther',
  [ActionGroupType.Other]: 'Other'
};

const iconsByActionGroupType = {
  [ActionGroupType.SelectTrace]: 'crosshair.svg',

  [ActionGroupType.TagTrace]: 'flag.svg',
  [ActionGroupType.TDValue]: 'content.svg',
  [ActionGroupType.TDTrackObject]: 'object.svg',
  [ActionGroupType.TDExecutions]: 'traceExecutions.svg',
  [ActionGroupType.TDTrackObjectTrace]: 'objectTrace.svg',
  [ActionGroupType.TDExecutionsTrace]: 'traceExecutionsTrace.svg',
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
  [ActionGroupType.CallGraphSearchContexts]: 'callGraphSearchContexts.svg',
  [ActionGroupType.CallGraphSearchTraces]: 'callGraphSearchTraces.svg',
  [ActionGroupType.CallGraphOther]: 'string.svg',
  [ActionGroupType.Other]: 'string.svg'
};

for (const typeName of ActionGroupType.names) {
  if (!iconsByActionGroupType[ActionGroupType[typeName]]) {
    warn(`icon setting of ActionGroupType.${typeName} not found`);
  }
}

export function getLabelByActionGroupType(actionGroupType) {
  return labelsByActionGroupType[actionGroupType] || '(unknown)';
}

export function getIconByActionGroup(actionGroupType) {
  const file = iconsByActionGroupType[actionGroupType] || 'string.svg';
  // const file = 'nextInContext.svg';
  return file;
}