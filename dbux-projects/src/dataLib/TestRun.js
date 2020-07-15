
function newTestRun(bug, result) {
  return {
    projectName: bug.project.name,
    bugId: bug.id,
    createAt: new Date(),
    nFailedTests: result.code,
    timer: undefined,
    patch: undefined, // TODO
  };
}

export default {
  newTestRun,
};