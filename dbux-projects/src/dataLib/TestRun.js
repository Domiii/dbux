export default class TestRun {
  /**
   * @param {Bug} exercise 
   * @param {number} nFailedTests
   * @param {string} patch 
   * @param {string[]} applicationUUIDs
   */
  constructor(exercise, nFailedTests, patch, applicationUUIDs) {
    this.projectName = exercise.project.name;
    this.exerciseId = exercise.id;
    this.createdAt = Date.now();
    this.nFailedTests = nFailedTests;
    this.patch = patch;
    this.applicationUUIDs = applicationUUIDs;
  }
}