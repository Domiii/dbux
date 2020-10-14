import Enum from '@dbux/common/src/util/Enum';


// eslint-disable-next-line import/no-mutable-exports
let UserActionType = {
  PracticeSessionChanged: 1,
  TestRunFinished: 2,
  NewBugProgress: 3,
  BugProgressChanged: 4,

  EditorEvent: 10,
  SelectTrace: 11,
  TagTrace: 12,
  TreeViewEvent: 13,
  CallGraphEvent: 14
};

UserActionType = new Enum(UserActionType);

export default UserActionType;