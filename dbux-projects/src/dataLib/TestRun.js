export default class TestRun {
  /**
   * @param {Bug} bug 
   * @param {Object} result 
   * @param {number} result.code
   * @param {string} patch 
   */
  constructor(bug, result, patch) {
    this.projectName = bug.project.name;
    this.bugId = bug.id;
    this.createdAt = Date.now();
    this.nFailedTests = result.code;
    this.timer = undefined;
    this.patch = patch;
  }
}

export function createTestRunWithPatchString(bug, patchString) {
  return new TestRun(bug, { code: -1 }, patchString);
}

export async function createTestRun(bug, result) {
  const patch = await bug.project.getPatchString();
  return new TestRun(bug, result, patch);
}