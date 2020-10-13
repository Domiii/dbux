export default class TestRun {
  /**
   * @param {Bug} bug 
   * @param {number} nFailedTests
   * @param {string} patch 
   */
  constructor(bug, nFailedTests, patch, applicationUUID) {
    this.applicationUUID = applicationUUID;
    this.projectName = bug.project.name;
    this.bugId = bug.id;
    this.createdAt = Date.now();
    this.nFailedTests = nFailedTests;
    this.patch = patch;
  }
}