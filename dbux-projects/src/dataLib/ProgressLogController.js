import pull from 'lodash/pull';
import { newLogger } from '@dbux/common/src/log/logger';
import Collection from '@dbux/data/src/Collection';
import Indexes from '@dbux/data/src/indexes/Indexes';
import ProgressLogUtil from './progressLogUtil';
import BugProgressByBugIdIndex from './indexes/BugProgressByBugIdIndex';
import TestRunsByBugIdIndex from './indexes/TestRunsByBugIdIndex';
import TestRun from './TestRun';
import BugProgress from './BugProgress';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ProgressLogController');

const storageKey = 'dbux-projects.progressLog';

/** @typedef {import('../ProjectsManager').default} ProjectsManager */
/** @typedef {import('./TestRun').default} TestRun */

/**
 * @extends {Collection<TestRun>}
 */
class TestRunCollection extends Collection {
  constructor(plc) {
    super('testRuns', plc);
  }
}

/**
 * @extends {Collection<BugProgress>}
 */
class BugProgressCollection extends Collection {
  constructor(plc) {
    super('bugProgresses', plc);
  }
}

export default class ProgressLogController {
  /**
   * Used for serialization
   */
  version = 1;

  /**
   * Internal event listeners.
   * 
   * @private
   */
  _dataEventListenersInternal = {};

  /**
   * Outside event listeners.
   * 
   * @private
   */
  _dataEventListeners = {};

  /**
   * @type {number[]}
   */
  versions = [];

  /**
   * @type {ProjectsManager}
   */
  manager;

  /**
   * @type {ProgressLogUtil}
   */
  util;

  constructor(manager) {
    this.manager = manager;
    this.storage = manager.externals.storage;

    this.util = Object.fromEntries(
      Object.keys(ProgressLogUtil).map(name => [name, ProgressLogUtil[name].bind(null, this)])
    );

    this.load();
  }

  // ###########################################################################
  // Public add/edit data
  // ###########################################################################

  /**
   * @param {Bug} bug 
   * @param {string} patchString 
   */
  addTestRun(bug, result, patchString) {
    const testRun = new TestRun(bug, result, patchString);
    this.addData({ testRuns: [testRun] });
  }

  /**
   * @param {Bug} bug
   * @param {number} status
   * @param {boolean} stopwatchEnabled
   * @return {BugProgress}
   */
  addBugProgress(bug, status, stopwatchEnabled) {
    const bugProgress = new BugProgress(bug, status, stopwatchEnabled);
    this.addData({ bugProgresses: [bugProgress] });
    return bugProgress;
  }

  /**
   * NOTE: A unfinished TestRun is saved with result.code = -1
   * @param {Bug} bug 
   * @param {string} patchString 
   */
  addUnfinishedTestRun(bug, patchString) {
    this.addTestRun(bug, { code: -1 }, patchString);
  }

  async addTestRunWithoutPatchString(bug, result) {
    const patchString = await bug.project.getPatchString();
    this.addTestRun(bug, result, patchString);
  }

  /**
   * NOTE: This may break indexes' keys
   * @param {Bug} bug 
   * @param {Object} update
   */
  updateBugProgress(bug, update) {
    const bugProgress = this.util.getBugProgressByBug(bug);
    for (const key of Object.keys(update)) {
      bugProgress[key] = update[key];
    }
    bugProgress.updatedAt = Date.now();
  }

  // ###########################################################################
  // Data flow 
  // ###########################################################################

  /**
   * Add a data event listener to given collection.
   * 
   * @param {string} collectionName
   * @param {([]) => void} cb
   * @returns {function} Unsubscribe function - Execute to cancel this listener.
   */
  onData(collectionName, cb) {
    const listeners = this._dataEventListeners[collectionName] =
      (this._dataEventListeners[collectionName] || []);
    listeners.push(cb);

    const unsubscribe = (() => {
      pull(this._dataEventListeners[collectionName], cb);
    });
    return unsubscribe;
  }

  /**
   * Bundled data listener.
   * 
   * @returns {function} Unsubscribe function - Execute to cancel this listener.
   */
  onDataAll(cfg) {
    for (const collectionName in cfg.collections) {
      const cb = cfg.collections[collectionName];
      const listeners = this._dataEventListeners[collectionName] = (this._dataEventListeners[collectionName] || []);
      listeners.push(cb);
    }

    const unsubscribe = (() => {
      for (const collectionName in cfg.collections) {
        const cb = cfg.collections[collectionName];
        pull(this._dataEventListeners[collectionName], cb);
      }
    });
    return unsubscribe;
  }

  /**
   * Add given data (of different collections) to this `DataProvier`
   * @param {{ [string]: any[] }} allData
   */
  addData(allData) {
    this._addData(allData);
    this._postAdd(allData);
  }

  addIndex(newIndex) {
    this.indexes._addIndex(newIndex);
    newIndex._init(this);
  }

  // ###########################################################################
  // Private methods
  // ###########################################################################

  _addData(allData) {
    for (const collectionName in allData) {
      const collection = this.collections[collectionName];
      if (!collection) {
        // should never happen
        logError('received data referencing invalid collection -', collectionName);
        delete this.collections[collectionName];
        continue;
      }

      const entries = allData[collectionName];
      ++this.versions[collection._id]; // update version
      collection.add(entries);
    }
  }

  _postAdd(allData) {
    // notify collections that adding has finished
    for (const collectionName in allData) {
      const collection = this.collections[collectionName];
      const entries = allData[collectionName];
      collection.postAdd(entries);
    }

    // indexes
    for (const collectionName in allData) {
      const indexes = this.indexes[collectionName];
      if (indexes) {
        const data = allData[collectionName];
        for (const name in indexes) {
          const index = indexes[name];
          if (index.addOnNewData) {
            indexes[name].addEntries(data);
          }
        }
      }
    }

    // notify collections that adding + index processing has finished
    for (const collectionName in allData) {
      const collection = this.collections[collectionName];
      const entries = allData[collectionName];
      collection.postIndex(entries);
    }

    // fire internal event listeners
    for (const collectionName in allData) {
      // const collection = this.collections[collectionName];
      const data = allData[collectionName];
      this._notifyData(collectionName, data, this._dataEventListenersInternal);
    }


    // fire public event listeners
    for (const collectionName in allData) {
      // const collection = this.collections[collectionName];
      const data = allData[collectionName];
      this._notifyData(collectionName, data, this._dataEventListeners);
    }
  }

  /**
   * 
   * @param {string} collectionName 
   * @param {[]} data 
   * @param {*} allListeners 
   */
  _notifyData(collectionName, data, allListeners) {
    const listeners = allListeners[collectionName];
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(data);
        }
        catch (err) {
          logError('Data event listener failed', err);
        }
      });
    }
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
      testRuns: new TestRunCollection(this),
      bugProgresses: new BugProgressCollection(this)
    };

    this.indexes = new Indexes();
    this.addIndex(new BugProgressByBugIdIndex());
    this.addIndex(new TestRunsByBugIdIndex());
  }


  /**
   * Save serialized data to external storage
   */
  async save() {
    try {
      const logString = this._serialize();
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
    this.init();
    try {
      const logString = this.storage.get(storageKey);
      if (logString !== undefined) {
        this._deserialize(JSON.parse(logString));
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

  /**
   * Serialize all raw data into a simple JS object.
   * Usage: `JSON.stringify(dataProvider.serialize())`.
   */
  _serialize() {
    const collections = Object.values(this.collections);
    const obj = {
      version: this.version,
      collections: Object.fromEntries(collections.map(collection => {
        let {
          name,
          _all: entries
        } = collection;

        return [
          name,
          entries.slice(1)
        ];
      }))
    };
    return JSON.stringify(obj, null, 2);
  }

  /**
   * Use: `this.deserialize(JSON.parse(stringFromFile))`
   */
  _deserialize(data) {
    const { version, collections } = data;
    if (version !== this.version) {
      throw new Error(`could not serialize DataProvider - incompatible version: ${version} !== ${this.version}`);
    }
    this.addData(collections);
  }
}