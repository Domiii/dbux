import { newLogger } from '@dbux/common/src/log/logger';
import Exercise from './Exercise';

/** @typedef {import('./Project').default} Project */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dbux-code');

export default class ExerciseList {
  /**
   * @type {Exercise[]}
   */
  _byNumber = [];
  /**
   * @type {Map<number, Exercise>}
   */
  _byId = new Map();

  _all = [];

  /**
   * @param {Exercise[]} exercises 
   */
  constructor(exercises) {
    for (const exercise of exercises) {
      this._byId.set(exercise.id, exercise);
      this._byNumber[exercise.number] = exercise;
      this._all.push(exercise);
    }
  }

  /**
   * @return {ProjectsManager}
   */
  get manager() {
    return this.project.manager;
  }

  /**
   * @return {Exercise}
   */
  getById(id) {
    return this._byId.get(id) || null;
  }

  getAt(i) {
    return this._byNumber[i];
  }

  *[Symbol.iterator]() {
    yield* this._all;
  }
}