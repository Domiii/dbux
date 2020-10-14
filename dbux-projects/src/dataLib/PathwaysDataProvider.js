import last from 'lodash/last';
import { newLogger } from '@dbux/common/src/log/logger';
import DataProviderBase from '@dbux/data/src/DataProviderBase';
import Collection from '@dbux/data/src/Collection';
import Indexes from '@dbux/data/src/indexes/Indexes';
import allApplications from '@dbux/data/src/applications/allApplications';
import PathwaysDataUtil from './pathwaysDataUtil';
import BugProgressByBugIdIndex from './indexes/BugProgressByBugIdIndex';
import TestRunsByBugIdIndex from './indexes/TestRunsByBugIdIndex';
import TestRun from './TestRun';
import BugProgress from './BugProgress';
import { emitBugProgressChanged, emitNewBugProgress, emitNewTestRun } from '../userEvents';
import UserActionByBugIdIndex from './indexes/UserActionByBugIdIndex';
import UserActionByTypeIndex from './indexes/UserActionByTypeIndex';
import UserActionsByStepIndex from './indexes/UserActionsByStepIndex';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('PathwaysDataProvider');

const storageKey = 'dbux.pathways.data';

/** @typedef {import('../ProjectsManager').default} ProjectsManager */
/** @typedef {import('./TestRun').default} TestRun */

/**
 * @extends {Collection<TestRun>}
 */
class TestRunCollection extends Collection {
  constructor(pdp) {
    super('testRuns', pdp);
  }
}

/**
 * @extends {Collection<BugProgress>}
 */
class BugProgressCollection extends Collection {
  constructor(pdp) {
    super('bugProgresses', pdp);
  }
}

/**
 * @extends {Collection<BugProgress>}
 */
class UserActionCollection extends Collection {
  constructor(pdp) {
    super('userActions', pdp);
  }
}

/**
 * @extends {Collection<Step>}
 */
class StepCollection extends Collection {
  constructor(pdp) {
    super('steps', pdp);
  }
}

export default class PathwaysDataProvider extends DataProviderBase {
  /**
   * @type {ProjectsManager}
   */
  manager;

  /**
   * @type {ProgressLogUtil}
   */
  util;

  lastStaticCodeChunkId = 0;
  lastStepId = 0;

  constructor(manager) {
    super('PathwaysDataProvider');
    this.manager = manager;
    this.storage = manager.externals.storage;

    this.util = Object.fromEntries(
      Object.keys(PathwaysDataUtil).map(name => [name, PathwaysDataUtil[name].bind(null, this)])
    );

    this.load();
  }

  // ###########################################################################
  // Public add/edit data
  // ###########################################################################

  /**
   * @param {Bug} bug 
   * @param {number} nFailedTests
   * @param {string} patchString 
   * @return {TestRun}
   */
  addTestRun(bug, nFailedTests, patchString) {
    const testRun = new TestRun(bug, nFailedTests, patchString);
    this.addData({ testRuns: [testRun] });
    const application = last(allApplications.selection.getAll());
    emitNewTestRun(testRun, application);

    return testRun;
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
    emitNewBugProgress(bugProgress);
    return bugProgress;
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
    emitBugProgressChanged(bugProgress);
  }

  // ###########################################################################
  // actions + steps
  // ###########################################################################
  
  addStep(staticCodeChunkId, firstAction) {
    this.lastStaticCodeChunkId = staticCodeChunkId;

    const {
      sessionId,
      bugId,
      createdAt
    } = firstAction;
    
    const step = {
      sessionId,
      bugId,
      createdAt,
      
      staticCodeChunkId,
      firstActionId: firstAction.id
    };
    this.addData({ steps: [step] });

    // update lastStepId
    this.lastStepId = step.id;
  }

  addNewUserAction(action) {
    // keep track of steps
    // NOTE: action.id is not set yet (will be set during `addData` below)
    const staticCodeChunkId = this.util.getActionStaticCodeChunkId(action);

    if (!this.lastCodeChunkId || staticCodeChunkId !== this.lastCodeChunkId) {
      this.addStep(staticCodeChunkId, action);
    }
    action.stepId = this.lastStepId;

    // add action
    this.addData({ userActions: [action] });
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
      bugProgresses: new BugProgressCollection(this),
      userActions: new UserActionCollection(this),
      steps: new StepCollection(this)
    };

    this.indexes = new Indexes();
    this.addIndex(new TestRunsByBugIdIndex());
    this.addIndex(new BugProgressByBugIdIndex());
    this.addIndex(new UserActionByBugIdIndex());
    this.addIndex(new UserActionByTypeIndex());
    this.addIndex(new UserActionsByStepIndex());
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
        this._deserialize(logString);
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
   * Serialize all raw data into JSON format.
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
   * Deserialize and recover the data that serialized by `this._serialize()`
   */
  _deserialize(dataString) {
    const data = JSON.parse(dataString);
    const { version, collections } = data;
    if (version !== this.version) {
      throw new Error(`could not serialize DataProvider - incompatible version: ${version} !== ${this.version}`);
    }
    this.addData(collections);
  }
}