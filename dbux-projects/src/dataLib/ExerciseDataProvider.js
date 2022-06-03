import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import DataProviderBase from '@dbux/data/src/DataProviderBase';
import Collection from '@dbux/data/src/Collection';
import Indexes from '@dbux/data/src/indexes/Indexes';
import ExerciseProgressByExerciseIdIndex from './indexes/ExerciseProgressByExerciseIdIndex';
import ExerciseProgress from './ExerciseProgress';
import { emitExerciseProgressChanged, emitNewExerciseProgress } from '../userEvents';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ExerciseDataProvider');

const storageKey = 'dbux-projects.exerciseData';

/** @typedef {import('../ProjectsManager').default} ProjectsManager */

/**
 * @extends {Collection<ExerciseProgress>}
 */
class ExerciseProgressCollection extends Collection {
  constructor(pdp) {
    super('exerciseProgresses', pdp);
  }
}

export default class ExerciseDataProvider extends DataProviderBase {
  /**
   * @type {ProjectsManager}
   */
  manager;

  constructor(manager) {
    super('ExerciseDataProvider');
    this.manager = manager;
    this.storage = manager.externals.storage;

    this.reset();
  }

  async init() {
    await this.load();
  }

  // ###########################################################################
  // Public add/edit data
  // ###########################################################################

  /**
   * @param {Exercise} exercise
   * @param {number} status
   * @param {boolean} stopwatchEnabled
   * @return {ExerciseProgress}
   */
  addExerciseProgress(exercise, stopwatchEnabled, moreProps = EmptyObject) {
    const exerciseProgress = new ExerciseProgress(exercise, stopwatchEnabled);
    Object.assign(exerciseProgress, moreProps);
    this.addData({ exerciseProgresses: [exerciseProgress] });
    emitNewExerciseProgress(exerciseProgress);
    return exerciseProgress;
  }

  /**
   * NOTE: This may break indexes' keys
   * @param {Exercise} exercise 
   * @param {Object} update
   */
  updateExerciseProgress(exercise, update) {
    const exerciseProgress = this.getExerciseProgress(exercise.id);
    if (!exerciseProgress) {
      this.logger.warn(`Tried to update bug (${Object.keys(update || {})}) progress but no previous record found: ${exercise.id}`);
      return;
    }
    Object.assign(exerciseProgress, update);
    exerciseProgress.updatedAt = Date.now();
    emitExerciseProgressChanged(exerciseProgress);
  }

  // ###########################################################################
  // util
  // ###########################################################################

  /**
   * @param {string} exerciseId 
   * @returns {ExerciseProgress}
   */
  getExerciseProgress(exerciseId) {
    return this.indexes.exerciseProgresses.byExerciseId.getUnique(exerciseId);
  }

  /**
   * @param {ExerciseProgress} exerciseProgress
   * @param {Exercise} exercise 
   */
  isExerciseProgressOfExercise(exerciseProgress, exercise) {
    return exerciseProgress.exerciseId === exercise.id;
  }

  // ###########################################################################
  // Data saving
  // ###########################################################################

  /**
   * Implementation, add indexes here
   * Note: Also resets all collections
   */
  reset() {
    this.collections = {
      exerciseProgresses: new ExerciseProgressCollection(this)
    };

    this.indexes = new Indexes();
    this.addIndex(new ExerciseProgressByExerciseIdIndex());
  }

  /**
   * Save serialized data to external storage
   */
  async save() {
    try {
      const logString = JSON.stringify(this.serializeJson());
      await this.storage.set(storageKey, logString);
    }
    catch (err) {
      logError('Failed to save progress log:', err);
    }
  }

  /**
   * Load serialized data from external storage
   */
  async load() {
    try {
      const logString = this.storage.get(storageKey);
      if (logString !== undefined) {
        await this.deserializeJson(JSON.parse(logString));
      }
    }
    catch (err) {
      logError('Failed to load progress log:', err);
    }
  }
}