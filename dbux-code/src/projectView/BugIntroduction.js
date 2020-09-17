
import { newLogger } from '@dbux/common/src/log/logger';
import { ViewColumn } from 'vscode';
import WebviewWrapper from '../codeUtil/WebviewWrapper';

/**
 * @typedef {import('@dbux/projects/src/projectLib/Bug').default} Bug
 */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('BugIntroduction');

const defaultColumn = ViewColumn.One;

export default class BugIntroduction extends WebviewWrapper {
  /**
   * 
   * @param {Bug} bug 
   */
  constructor(bug) {
    super('dbux-bugIntroduction', 'Introduction', defaultColumn);

    this.bug = bug;
  }

  async buildClientHtml() {
    return `debugTag: ${this.bug.debugTag}<br>`
         + `description: ${this.bug.description}<br>`
         + `name: ${this.bug.name}<br>`
         + `testRe: ${JSON.stringify(this.bug.testRe)}`;
  }

  async startHost() {}

  async shutdownHost() {}
}

export async function showBugIntroduction(bug) {
  let bugIntroduction = new BugIntroduction(bug);
  await bugIntroduction.show();

  return bugIntroduction;
}