import { newLogger } from 'dbux-common/src/log/logger';

const { log, debug, warn, error: logError } = newLogger('ProgressLog');

// TODO: type def of TestRun, BugResult

export default class ProgressLog {
  /**
   * @param {Object} [logObject]
   * @param {TestRun[]} logObject.testRuns
   * @param {BugResult[]} logObject.bugResults
   */
  constructor(logObject) {
    this.testRuns = [...(logObject?.testRuns || [])];
    this.bugResults = [...(logObject?.bugResults || [])];
  }

  /**
   * @param {string} logString 
   */
  static fromString(logString) {
    try {
      return new ProgressLog(JSON.parse(logString));
    }
    catch {
      logError('Failed converting string to progress log, string:', logString);
      return null;
    }
  }

  serialize() {
    return JSON.stringify({
      testRuns: this.testRuns,
      bugResults: this.bugResults
    });
  }
}