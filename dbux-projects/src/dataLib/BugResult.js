
import BugResultStatusType from './BugResultStatusType';

function newBugResult(bug) {
  let now = new Date();
  return {
    projectName: bug.project.name,
    bugId: bug.id,
    createAt: now,
    updateAt: now,
    status: BugResultStatusType.None,
  };
}

function isMatch(bugResult, projectName, bugId) {
  return bugResult.projectName === projectName && bugResult.bugId == bugId;
}

function updateStatus(bugResult, result) {
  bugResult.updateAt = new Date();
  bugResult.status = result.code ? BugResultStatusType.Attempted : BugResultStatusType.Solved;
}

export default {
  newBugResult,
  isMatch,
  updateStatus,
};