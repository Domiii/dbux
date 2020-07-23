import { newLogger } from '@dbux/common/src/log/logger';
import TestRun from './TestRunDef';
import BugProgress from './BugProgress';


const { log, debug, warn, error: logError } = newLogger('ProgressLog');


export default class ProgressLog {
  /**
   * @param {Object} [logObject]
   * @param {TestRun[]} logObject.testRuns
   * @param {BugProgress[]} logObject.bugProgresses
   */
  constructor(logObject) {
    this.testRuns = [...(logObject?.testRuns || [])];
    this.bugProgresses = [...(logObject?.bugProgresses || [])];
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
      bugProgresses: this.bugProgresses
    });
  }
}