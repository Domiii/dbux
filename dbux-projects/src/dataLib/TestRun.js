export default class TestRun {
  /**
   * @param {Bug} bug 
   * @param {number} nFailedTests
   * @param {string} patch 
   */
  constructor(bug, nFailedTests, patch) {
    this.projectName = bug.project.name;
    this.bugId = bug.id;
    this.createdAt = Date.now();
    this.nFailedTests = nFailedTests;
    this.timer = undefined;
    this.patch = patch;
  }
}