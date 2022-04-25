
import { newLogger } from '@dbux/common/src/log/logger';
import { ViewColumn } from 'vscode';
import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import WebviewWrapper from '../codeUtil/WebviewWrapper';
import { getThemeResourcePathUri } from '../codeUtil/codePath';
import { emitShowExerciseIntroductionViewAction } from '../userEvents';

/**
 * @typedef {import('@dbux/projects/src/projectLib/Exercise').default} Exercise
 */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ExerciseIntroduction');

const defaultColumn = ViewColumn.One;

function makeContentString(content) {
  return JSON.stringify(content, null, 2);
}

function makeOl(items) {
  return `<ol>${items.map(item => `<li>${item}</li>`).join('\n')}</ol>`;
}

function makeUl(items) {
  return `<ul>${items.map(item => `<li>${item}</li>`).join('\n')}</ul>`;
}

export default class ExerciseIntroductionView extends WebviewWrapper {
  /**
   * 
   * @param {Exercise} exercise 
   */
  constructor(exercise) {
    super('dbux-exerciseIntroduction', `Exercise #${exercise.id}`, defaultColumn);

    this.exercise = exercise;
  }

  getIcon() {
    return getThemeResourcePathUri('question.svg');
  }

  buildEntryHtml(title, content) {
    return `<h2>${title}</h2>\n<p>${content}</p>\n`;
  }

  buildExerciseEntryHtml = (title, item, cb = makeContentString) => {
    if (!item) {
      item = title;
    }

    let content = this.exercise[item];
    if (isEmpty(content)) {
      return '';
    }
    else if (!isString(content)) {
      content = cb(content);
    }
    return this.buildEntryHtml(title, content);
  }

  async buildClientHtml() {
    const entryHtml = this.buildExerciseEntryHtml;
    return [
      `<h1>${this.exercise.id}</h1>`,
      entryHtml('label'),
      entryHtml('description'),
      entryHtml('stepsToReproduce', null, makeOl),
      entryHtml('tags', null, makeUl),
      entryHtml('testRe'),
      entryHtml('difficulty'),
    ].join('\n\n');
  }

  async startHost() { }

  async shutdownHost() { }
}

export async function showExerciseIntroduction(exercise) {
  let exerciseIntroductionView = new ExerciseIntroductionView(exercise);
  await exerciseIntroductionView.show();
  emitShowExerciseIntroductionViewAction(exercise);
  return exerciseIntroductionView;
}