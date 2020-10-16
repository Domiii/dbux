// import UserActionType from '@dbux/data/src/pathways/UserActionType';
import ActionGroupType from '@dbux/data/src/pathways/ActionGroupType';

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
  [ActionGroupType.Other]: 'Other',
  [ActionGroupType.Hidden]: 'Hidden'
};


export function getLabelByActionGroupType(actionGroupType) {
  return labelsByActionGroupType[actionGroupType] || '(unknown)';
}

export function getIconByActionGroup(actionGroupType) {
  const name = ActionGroupType.getName(actionGroupType);
  return `icons/groups/${name}.png`;
}