import Enum from '@dbux/common/src/util/Enum';


// eslint-disable-next-line import/no-mutable-exports
let ActionGroupType = {
  SelectTrace: 1,
  TagTrace: 2,

  TDNavigation: 22,
  TDValueClick: 23,
  TDValueCollapseChange: 24,
  TDTrackObjectUse: 25,
  TDObjectUse: 26,
  TDExecutionsUse: 27,
  TDTraceUse: 30,

  CallGraphSelectTrace: 20,
  CallGraphSearch: 21,
  CallGraphOther: 22,

  // gear icon
  Other: 100,

  Hidden: 1000
};

ActionGroupType = new Enum(ActionGroupType);

/**
 * Actions the user usually does purposefully as part of their investigation.
 * Excludes status updates and editor events.
 */
export function isMajorAction(actionType) {
  return majorAction[actionType];
}

export default ActionGroupType;
