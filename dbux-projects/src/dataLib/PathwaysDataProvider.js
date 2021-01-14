import fs from 'fs';
import path from 'path';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType, { isCodeActionTypes } from '@dbux/data/src/pathways/UserActionType';
import DataProviderBase from '@dbux/data/src/DataProviderBase';
import Collection from '@dbux/data/src/Collection';
import Indexes from '@dbux/data/src/indexes/Indexes';
import { getGroupTypeByActionType } from '@dbux/data/src/pathways/ActionGroupType';
import StepType, { getStepTypeByActionType } from '@dbux/data/src/pathways/StepType';
import { emitNewTestRun } from '../userEvents';
import getFirstLine from '../util/readFirstLine';
import PathwaysDataUtil from './pathwaysDataUtil';
import TestRunsByBugIdIndex from './indexes/TestRunsByBugIdIndex';
import UserActionByBugIdIndex from './indexes/UserActionByBugIdIndex';
import UserActionByTypeIndex from './indexes/UserActionByTypeIndex';
import UserActionsByStepIndex from './indexes/UserActionsByStepIndex';
import UserActionsByGroupIndex from './indexes/UserActionsByGroupIndex';
import VisibleActionGroupByStepIdIndex from './indexes/VisibleActionGroupByStepIdIndex';
import StepsByTypeIndex from './indexes/StepsByTypeIndex';
import StepsByGroupIndex from './indexes/StepsByGroupIndex';
import TestRun from './TestRun';
import LogFileLoader from './LogFileLoader';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('PathwaysDataProvider');

/** @typedef {import('../ProjectsManager').default} ProjectsManager */
/** @typedef {import('./TestRun').default} TestRun */
/** @typedef {import('@dbux/data/src/applications/Application').default} Application */

/**
 * @extends {Collection<TestRun>}
 */
class TestRunCollection extends Collection {
  constructor(pdp) {
    super('testRuns', pdp);
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
    const relativeEntryPointPath = path.relative(this.dp.manager.config.projectsRoot, entryPointPath).replace(/\\/g, '/');
    return {
      relativeEntryPointPath,
      createdAt,
      uuid: application.uuid,
      serializedDpData: application.dataProvider.serialize()
    };
  }

  /**
   * 
   * @param {PathwaysDataProvider} pdp 
   */
  deserialize({ relativeEntryPointPath, createdAt, uuid, serializedDpData }) {
    const entryPointPath = path.join(this.dp.manager.config.projectsRoot, relativeEntryPointPath);
    const app = allApplications.addApplication({ entryPointPath, createdAt, uuid });
    app.dataProvider.deserialize(JSON.parse(serializedDpData));
    return app;
  }
}

/**
 * @extends {Collection<UserAction>}
 */
class UserActionCollection extends Collection {
  visitedStaticTracesByFile = new Map();

  constructor(pdp) {
    super('userActions', pdp);
  }

  handleEntryAdded(entry) {
    const { trace } = entry;
    if (!trace) {
      return;
    }

    const { applicationId, staticTraceId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;

    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const { staticContextId } = staticTrace;
    const { programId } = dp.collections.staticContexts.getById(staticContextId);
    const fileName = programId && dp.collections.staticProgramContexts.getById(programId).filePath || '(unknown file)';

    let staticTraces = this.visitedStaticTracesByFile.get(fileName);
    if (!staticTraces) {
      this.visitedStaticTracesByFile.set(fileName, staticTraces = []);
    }
    staticTraces.push(staticTrace);
  }

  serialize(action) {
    action = { ...action };
    if (isCodeActionTypes(action.type)) {
      action.file = path.relative(this.dp.manager.config.projectsRoot, action.file).replace(/\\/g, '/');
    }
    return action;
  }

  deserialize(action) {
    if (isCodeActionTypes(action.type)) {
      action.file = path.join(this.dp.manager.config.projectsRoot, action.file);
    }
    return action;
  }
}

/**
 * @extends {Collection<Step>}
 */
class StepCollection extends Collection {
  groupIdsByKey = new Map();

  constructor(pdp) {
    super('steps', pdp);
  }

  handleEntryAdded(step) {
    if (!step.stepGroupId) {
      // convert group's string key to numerical id (since our indexes only accept numerical ids)
      const {
        type,
        staticContextId
      } = step;

      // const stepGroupKey = `${type}_${staticContextId}`;
      const stepGroupKey = staticContextId ? `staticContextId_${staticContextId}` : `type_${type}`;
      let stepGroupId = this.groupIdsByKey.get(stepGroupKey);
      if (!stepGroupId) {
        this.groupIdsByKey.set(stepGroupKey, stepGroupId = this.groupIdsByKey.size + 1);
      }
      step.stepGroupId = stepGroupId;
    }
  }
}

/**
 * @extends {Collection<ActionGroup>}
 */
class ActionGroupCollection extends Collection {
  constructor(pdp) {
    super('actionGroups', pdp);
  }
}

export default class PathwaysDataProvider extends DataProviderBase {
  /**
   * @type {ProjectsManager}
   */
  manager;

  /**
   * @type {PathwaysDataUtil}
   */
  util;

  // stepsByStaticContextId = new Map();

  constructor(manager) {
    super('PathwaysDataProvider');
    this.manager = manager;
    this.version = 2;

    this.util = Object.fromEntries(
      Object.keys(PathwaysDataUtil).map(name => [name, PathwaysDataUtil[name].bind(null, this)])
    );

    const logFolderPath = manager.externals.resources.getLogsDirectory();
    if (!fs.existsSync(logFolderPath)) {
      fs.mkdirSync(logFolderPath);
    }

    this.reset();
  }

  get session() {
    return this.manager.practiceSession;
  }

  get sessionId() {
    return this.session?.sessionId;
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

  // ###########################################################################
  // actions + steps
  // ###########################################################################

  addNewStep(firstAction, writeToLog = true) {
    const {
      applicationId = 0,
      staticContextId = 0
    } = this.util.getActionStaticContextId(firstAction) || EmptyObject;

    const {
      sessionId,
      bugId,
      type: actionType,
      createdAt,
      trace
    } = firstAction;

    const type = getStepTypeByActionType(actionType);
    const contextId = trace?.contextId;
    const firstTraceId = trace?.traceId;

    const step = {
      sessionId,
      bugId,
      createdAt,

      type,
      applicationId,
      staticContextId,
      contextId,

      firstTraceId
    };

    this.addData({ steps: [step] }, writeToLog);
    return step;
  }


  addNewGroup(step, firstAction, writeToLog = true) {
    const { id: stepId } = step;
    // const { id: actionId } = firstAction;
    const {
      createdAt,
      type: actionType,
      searchTerm,
      annotation
    } = firstAction;

    const groupType = getGroupTypeByActionType(actionType);

    const group = {
      stepId,
      createdAt,
      type: groupType,

      searchTerm,
      annotation
    };

    this.addData({ actionGroups: [group] }, writeToLog);
    return group;
  }

  addNewUserAction(action, writeToLog = true) {
    // step
    const lastStep = this.collections.steps.getLast();
    let step = lastStep;
    if (this.shouldAddNewStep(action)) {
      // create new step
      step = this.addNewStep(action, writeToLog);
    }
    action.stepId = step.id;

    // actionGroup
    const lastActionGroup = this.collections.actionGroups.getLast();
    let actionGroup = lastActionGroup;
    if (!lastActionGroup || lastStep !== step || !this.util.shouldClumpNextActionIntoGroup(action, lastActionGroup)) {
      // create new group
      actionGroup = this.addNewGroup(step, action, writeToLog);
    }
    action.groupId = actionGroup.id;

    // add action
    this.addData({ userActions: [action] }, writeToLog);
  }

  shouldAddNewStep(action) {
    // NOTE: action.id is not set yet (will be set during `addData`)
    const {
      applicationId,
      staticContextId,
    } = this.util.getActionStaticContextId(action) || EmptyObject;
    const lastStep = this.collections.steps.getLast();
    const lastStepType = lastStep?.type || StepType.None;
    const lastStaticContextId = lastStep?.staticContextId || 0;
    const lastApplicationId = lastStep?.applicationId || 0;

    const stepType = getStepTypeByActionType(action.type);

    if (!lastStep || action.newStep) {
      return true;
    }

    if (StepType.is.None(stepType)) {
      return false;
    }

    if (applicationId && staticContextId) {
      if ((applicationId === lastApplicationId) && (staticContextId === lastStaticContextId)) {
        return false;
      }
      else {
        return true;
      }
    }

    if (lastStepType && stepType === lastStepType) {
      return false;
    }

    return true;
  }

  // ###########################################################################
  // Data load + save
  // ###########################################################################

  /**
   * Reset pdp and load from log file
   */
  init() {
    this.reset();
    this.load();
  }

  reset() {
    this.collections = {
      testRuns: new TestRunCollection(this),
      applications: new ApplicationCollection(this)
    };

    this.indexes = new Indexes();
    this.addIndex(new TestRunsByBugIdIndex());

    this._resetUserActions();
  }

  _resetUserActions() {
    this.collections = {
      ...this.collections,

      steps: new StepCollection(this),
      actionGroups: new ActionGroupCollection(this),
      userActions: new UserActionCollection(this),
    };

    this.addIndex(new UserActionByBugIdIndex());
    this.addIndex(new UserActionByTypeIndex());
    this.addIndex(new UserActionsByStepIndex());
    this.addIndex(new UserActionsByGroupIndex());
    this.addIndex(new VisibleActionGroupByStepIdIndex());
    this.addIndex(new StepsByGroupIndex());
    this.addIndex(new StepsByTypeIndex());
  }

  async clearSteps() {
    this._resetUserActions();
    fs.unlinkSync(this.session.logFilePath);

    this.writeHeader();
    this.writeAll(
      Object.fromEntries(['testRuns', 'applications'].
        map(name => this.collections[name]).
        map(collection => [collection.name, Array.from(collection)])
      )
    );

    this._notifyData({

    });
  }

  /**
   * Load data from log file
   * @param {string} [logFilePath] 
   */
  load() {
    try {
      let [headerString, ...allData] = fs.readFileSync(this.session.logFilePath, 'utf8').split(/\r?\n/);
      const header = JSON.parse(headerString);
      if (!header.headerTag) {
        // handle log files from version=1 which do not contain headers, this should be removed in the next version
        warn(`No header is found in log file, assume it is of version 1`);
        allData.unshift(headerString);
        header.version = 1;
      }
      allData = allData.filter(s => s).map((s) => JSON.parse(s));

      const dataToAdd = Object.fromEntries(Object.keys(this.collections).map(name => [name, []]));
      for (let { collectionName, data } of allData) {
        if (this.collections[collectionName].deserialize) {
          data = this.collections[collectionName].deserialize(data);
        }
        dataToAdd[collectionName].push(data);
      }
      this.loadByVersion[header.version](header, dataToAdd);
    }
    catch (err) {
      if (err.code === 'ENOENT') {
        log(`No log file found at "${this.session.logFilePath}", header written`);
        this.writeHeader();
      }
      else {
        logError('Failed to load from log file:', err);
        throw err;
      }
    }
  }

  loadByVersion = Object.fromEntries(
    Object.entries(LogFileLoader).map(([name, func]) => [name, func.bind(this)])
  );

  addData(allData, writeToLog = true) {
    super.addData(allData);

    if (writeToLog) {
      this.writeAll(allData);
    }
  }

  writeAll(allData) {
    for (const collectionName in allData) {
      for (let data of allData[collectionName]) {
        if (this.collections[collectionName].serialize) {
          data = this.collections[collectionName].serialize(data);
        }
        this.writeOnData(collectionName, data);
      }
    }
  }

  /**
   * @param {string} collectionName
   */
  writeOnData(collectionName, data) {
    fs.appendFileSync(this.session.logFilePath, `${JSON.stringify({ collectionName, data })}\n`, { flag: 'a' });
  }

  writeHeader() {
    const { version } = this;
    const { logFilePath, sessionId, createdAt, bug: { id: bugId } } = this.session;
    fs.appendFileSync(logFilePath, `${JSON.stringify({ headerTag: true, version, sessionId, bugId, createdAt })}\n`, { flag: 'ax' });
  }

  static async parseHeader(filePath) {
    const firstLine = await getFirstLine(filePath);
    const header = JSON.parse(firstLine);
    if (!header.headerTag) {
      throw new Error('No header imformation in log file');
    }
    return header;
  }
}