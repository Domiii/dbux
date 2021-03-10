import { newLogger } from '@dbux/common/src/log/logger';
import DataProviderBase from '@dbux/data/src/DataProviderBase';
import Collection from '@dbux/data/src/Collection';
import Indexes from '@dbux/data/src/indexes/Indexes';
import BugProgressByBugIdIndex from './indexes/BugProgressByBugIdIndex';
import BugProgress from './BugProgress';
import { emitBugProgressChanged, emitNewBugProgress } from '../userEvents';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('BugDataProvider');

const storageKey = 'dbux-projects.bugData';

/** @typedef {import('../ProjectsManager').default} ProjectsManager */

/**
 * @extends {Collection<BugProgress>}
 */
class BugProgressCollection extends Collection {
  constructor(pdp) {
    super('bugProgresses', pdp);
  }
}

export default class BugDataProvider extends DataProviderBase {
  /**
   * @type {ProjectsManager}
   */
  manager;

  constructor(manager) {
    super('BugDataProvider');
    this.manager = manager;
    this.storage = manager.externals.storage;

    this.init();
    this.load();
  }

  // ###########################################################################
  // Public add/edit data
  // ###########################################################################

  /**
   * @param {Bug} bug
   * @param {number} status
   * @param {boolean} stopwatchEnabled
   * @return {BugProgress}
   */
  addBugProgress(bug, status, stopwatchEnabled) {
    const bugProgress = new BugProgress(bug, status, stopwatchEnabled);
    this.addData({ bugProgresses: [bugProgress] });
    emitNewBugProgress(bugProgress);
    return bugProgress;
  }

  /**
   * NOTE: This may break indexes' keys
   * @param {Bug} bug 
   * @param {Object} update
   */
  updateBugProgress(bug, update) {
    const bugProgress = this.getBugProgressByBug(bug);
    if (!bugProgress) {
      this.logger.error(`Tried to update bug (${Object.keys(update || {})}) progress but no previous record found: ${bug.id}`);
      return;
    }
    for (const key of Object.keys(update)) {
      bugProgress[key] = update[key];
    }
    bugProgress.updatedAt = Date.now();
    emitBugProgressChanged(bugProgress);
  }

  // ###########################################################################
  // util
  // ###########################################################################

  getBugProgressByBug(bug) {
    return this.indexes.bugProgresses.byBugId.get(bug.id)?.[0] || null;
  }

  /**
   * @param {BugProgress} bugProgress
   * @param {Bug} bug 
   */
  isBugProgressOfBug(bugProgress, bug) {
    return bugProgress.bugId === bug.id;
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
      bugProgresses: new BugProgressCollection(this)
    };

    this.indexes = new Indexes();
    this.addIndex(new BugProgressByBugIdIndex());
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