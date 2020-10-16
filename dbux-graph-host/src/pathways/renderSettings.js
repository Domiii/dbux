// import UserActionType from '@dbux/data/src/pathways/UserActionType';
import ActionGroupType from '@dbux/data/src/pathways/ActionGroupType';
import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';

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
  [ActionGroupType.CallGraphSearch]: 'CallGraphSearch',
  [ActionGroupType.CallGraphTrace]: 'CallGraphTrace',
  [ActionGroupType.CallGraphOther]: 'CallGraphOther',
  [ActionGroupType.Other]: 'Other'
};

const iconsByActionGroupType = {
  [ActionGroupType.SelectTrace]: 'crosshair.svg',
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
  [ActionGroupType.CallGraphSearch]: 'CallGraphSearch',
  [ActionGroupType.CallGraphTrace]: 'CallGraphTrace',
  [ActionGroupType.CallGraphOther]: 'CallGraphOther',
  [ActionGroupType.Other]: 'string.svg'
};


export function getLabelByActionGroupType(actionGroupType) {
  return labelsByActionGroupType[actionGroupType] || '(unknown)';
}

export function getIconUrlByActionGroup(themeMode, actionGroupType) {
  // const file = iconsByActionGroupType[actionGroupType] || '';
  const file = 'nextInContext.svg';
  const modeName = ThemeMode.getName(themeMode).toLowerCase();
  // return `dist/web/pathways/img/${themeMode}/groups/${file}`;
  return getClientResourceUri(`${modeName}/${file}`);
}