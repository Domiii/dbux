
async function newTestRun(bug, result) {
  return {
    projectName: bug.project.name,
    bugId: bug.id,
    createAt: new Date(),
    nFailedTests: result.code,
    timer: undefined,
    patch: await bug.project.getPatchString(), 
  };
}

function newTestRunWithPatchString(bug, patchString) {
  return {
    projectName: bug.project.name,
    bugId: bug.id,
    createAt: new Date(),
    nFailedTests: -1,
    timer: undefined,
    patch: patchString,
  };
}

function isTestRunOfBug(obj, bug) {
  return obj.projectName === bug.project.name && obj.bugId === bug.id;
}

export default {
  newTestRun,
  newTestRunWithPatchString,
  isTestRunOfBug,
};