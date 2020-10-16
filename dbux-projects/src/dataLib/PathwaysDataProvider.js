import { newLogger } from '@dbux/common/src/log/logger';
import DataProviderBase from '@dbux/data/src/DataProviderBase';
import Collection from '@dbux/data/src/Collection';
import Indexes from '@dbux/data/src/indexes/Indexes';
import Application from '@dbux/data/src/applications/Application';
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
 * @extends {Collection<Application>}
 */
class ApplicationCollection extends Collection {
  constructor(pdp) {
    super('applications', pdp);
    this.deserializedCount = 0;
  }

  /**
   * @param {Application} application 
   * @return {Object} plain JS Object
   */
  serialize(application) {
    const { entryPointPath, createdAt } = application;
    return {
      entryPointPath,
      createdAt,
      uuid: application.uuid,
      serializedDpData: application.dataProvider.serialize()
    };
  }

  /**
   * 
   * @param {PathwaysDataProvider} pdp 
   */
  deserialize({ entryPointPath, createdAt, uuid, serializedDpData }) {
    // NOTE: currently we are not linking `oldApplications` with `allApplications`
    const app = new Application(++this.deserializedCount, entryPointPath, createdAt, null, uuid);
    app.dataProvider.deserialize(JSON.parse(serializedDpData));
    return app;
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

  lastCodeChunkId = 0;
  lastStepId = 0;

  stepsByCodeChunkId = new Map();

  constructor(manager) {
    super('PathwaysDataProvider');
    this.manager = manager;
    this.storage = manager.externals.storage;

    this.util = Object.fromEntries(
      Object.keys(PathwaysDataUtil).map(name => [name, PathwaysDataUtil[name].bind(null, this)])
    );
  }

  // ###########################################################################
  // Public add/edit data
  // ###########################################################################

  /**
   * @param {Bug} bug 
   * @param {number} nFailedTests
   * @param {string} patchString 
   * @param {Application[]} apps applications of this TestRun
   * @return {TestRun}
   */
  addTestRun(bug, nFailedTests, patchString, apps) {
    const appUUIDs = apps.map(app => app.uuid);
    const testRun = new TestRun(bug, nFailedTests, patchString, appUUIDs);
    this.addData({ testRuns: [testRun] });

    emitNewTestRun(testRun);

    return testRun;
  }

  /**
   * @param {Application[]} apps 
   */
  addApplications(apps) {
    this.addData({ applications: apps });
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
  // actions + steps
  // ###########################################################################
  
  addStep(codeChunkId, firstAction) {
    const {
      sessionId,
      bugId,
      createdAt
    } = firstAction;

    const step = {
      sessionId,
      bugId,
      createdAt,
      
      codeChunkId,
      firstActionId: firstAction.id
    };
    this.addData({ steps: [step] });

    this.stepsByCodeChunkId.set(codeChunkId, step);

    return step;
  }

  getActionStepId() {

  }

  addNewUserAction(action) {
    // keep track of steps
    // NOTE: action.id is not set yet (will be set during `addData` below)
    const codeChunkId = this.util.getActionCodeChunkId(action);

    if (!this.lastStepId || (codeChunkId && codeChunkId !== this.lastCodeChunkId)) {
      let step = this.stepsByCodeChunkId.get(codeChunkId);
      if (!step) {
        step = this.addStep(codeChunkId, action);
      }

      this.lastCodeChunkId = codeChunkId;
      this.lastStepId = step.id;
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
      applications: new ApplicationCollection(this),
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
      const logString = this.serialize();
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
        this.deserialize(JSON.parse(logString));
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