
import { newLogger } from '@dbux/common/src/log/logger';
import { ViewColumn } from 'vscode';
import WebviewWrapper from '../codeUtil/WebviewWrapper';

/**
 * @typedef {import('@dbux/projects/src/projectLib/Exercise').default} Exercise
 */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ExerciseIntroduction');

const defaultColumn = ViewColumn.One;

export default class BugIntroduction extends WebviewWrapper {
  /**
   * 
   * @param {Exercise} exercise 
   */
  constructor(exercise) {
    super('dbux-bugIntroduction', `Introduction: exercise #${exercise.id}`, defaultColumn);

    this.exercise = exercise;
  }

  async buildClientHtml() {
    return `Bug ${this.exercise.id}<br>`
      // + `name: ${this.bug.name}<br>`
      + `label: ${this.exercise.label}<br>`
      + `description: ${this.exercise.description}<br>`
      + (this.exercise.testRe && `testRe: ${JSON.stringify(this.exercise.testRe)}<br>` || '')
      + `debugTag: ${this.exercise.debugTag}<br>`;
  }

  async startHost() { }

  async shutdownHost() { }
}

export async function showBugIntroduction(exercise) {
  let bugIntroduction = new BugIntroduction(exercise);
  await bugIntroduction.show();

  return bugIntroduction;
}