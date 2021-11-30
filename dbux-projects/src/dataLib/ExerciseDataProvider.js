import { newLogger } from '@dbux/common/src/log/logger';
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

    this.init();
    this.load();
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
  addExerciseProgress(exercise, status, stopwatchEnabled) {
    const exerciseProgress = new ExerciseProgress(exercise, status, stopwatchEnabled);
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
    const exerciseProgress = this.getExerciseProgressByExercise(exercise);
    if (!exerciseProgress) {
      this.logger.error(`Tried to update bug (${Object.keys(update || {})}) progress but no previous record found: ${exercise.id}`);
      return;
    }
    for (const key of Object.keys(update)) {
      exerciseProgress[key] = update[key];
    }
    exerciseProgress.updatedAt = Date.now();
    emitExerciseProgressChanged(exerciseProgress);
  }

  // ###########################################################################
  // util
  // ###########################################################################

  /**
   * @param {Exercise} exercise 
   * @returns {ExerciseProgress}
   */
  getExerciseProgressByExercise(exercise) {
    return this.indexes.exerciseProgresses.byExerciseId.get(exercise.id)?.[0] || null;
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
  init() {
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
  load() {
    try {
      const logString = this.storage.get(storageKey);
      if (logString !== undefined) {
        this.deserializeJson(JSON.parse(logString));
      }
    }
    catch (err) {
      logError('Failed to load progress log:', err);
    }
  }

  async reset() {
    this.init();
    await this.save();
  }
}