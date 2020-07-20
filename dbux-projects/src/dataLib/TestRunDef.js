export default class TestRun {
  constructor(bug, result, patch) {
    this.projectName = bug.project.name;
    this.bugId = bug.id;
    this.createAt = new Date();
    this.nFailedTests = result.code;
    this.timer = undefined;
  }
}

export async function createTestRun(bug, result) {
  const patch = await bug.project.getPatchString();
  return new TestRun(bug, result, patch);
}