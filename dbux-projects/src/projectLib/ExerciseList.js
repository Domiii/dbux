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
  /**
   * @type {Map<string, Exercise>}
   */
  _byName = new Map();

  /**
   * @type {Exercise[]}
   */
  _all = [];

  /**
   * @param {Exercise[]} exercises 
   */
  constructor(exercises) {
    for (const exercise of exercises) {
      this._byId.set(exercise.id, exercise);
      this._byNumber[exercise.number] = exercise;
      if (exercise.name) {
        if (this._byName[exercise.name]) {
          // throw new Error(`exercise name is not unique for ${exercise.id}: ${JSON.stringify(exercise)}`);
          throw new Error(`exercise name is not unique for ${exercise.id}, name: ${exercise.name}`);
        }
        this._byName[exercise.name] = exercise;
      }
      this._all.push(exercise);
    }
  }

  /**
   * @return {ProjectsManager}
   */
  get manager() {
    return this.project.manager;
  }

  get length() {
    return this._all.length;
  }

  /**
   * @return {Exercise}
   */
  getById(id) {
    return this._byId.get(id) || null;
  }

  getByName(name) {
    return this._byName.get(name) || null;
  }

  getAt(i) {
    return this._byNumber[i];
  }

  getAll() {
    return this._all;
  }

  *[Symbol.iterator]() {
    yield* this._all;
  }
}