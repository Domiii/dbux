
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

export default {
  newTestRun,
};