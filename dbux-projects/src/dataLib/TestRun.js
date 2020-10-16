export default class TestRun {
  /**
   * @param {Bug} bug 
   * @param {number} nFailedTests
   * @param {string} patch 
   * @param {string[]} applicationUUIDs
   */
  constructor(bug, nFailedTests, patch, applicationUUIDs) {
    this.projectName = bug.project.name;
    this.bugId = bug.id;
    this.createdAt = Date.now();
    this.nFailedTests = nFailedTests;
    this.patch = patch;
    this.applicationUUIDs = applicationUUIDs;
  }
}