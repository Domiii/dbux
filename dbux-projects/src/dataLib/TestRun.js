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
    this.createAt = Date.now();
    this.nFailedTests = result.code;
    this.timer = undefined;
    this.patch = patch;
  }
}