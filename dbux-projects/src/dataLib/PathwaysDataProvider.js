import fs from 'fs';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { newLogger } from '@dbux/common/src/log/logger';
import NestedError from '@dbux/common/src/NestedError';
import { pathJoin, pathRelative } from '@dbux/common-node/src/util/pathUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { isCodeActionTypes } from '@dbux/data/src/pathways/UserActionType';
import DataProviderBase from '@dbux/data/src/DataProviderBase';
import Collection from '@dbux/data/src/Collection';
import Indexes from '@dbux/data/src/indexes/Indexes';
import { getGroupTypeByActionType } from '@dbux/data/src/pathways/ActionGroupType';
import StepType, { getStepTypeByActionType } from '@dbux/data/src/pathways/StepType';
import { extractApplicationData, importApplication } from '../dbux-analysis-tools/importExport';
import { emitNewTestRun, emitNewApplicationsAction } from '../userEvents';
import getFirstLine from '../util/readFirstLine';
import PathwaysDataUtil from './pathwaysDataUtil';
import TestRunsByExerciseIdIndex from './indexes/TestRunsByExerciseIdIndex';
import UserActionByTypeIndex from './indexes/UserActionByTypeIndex';
import UserActionsByStepIndex from './indexes/UserActionsByStepIndex';
import UserActionsByGroupIndex from './indexes/UserActionsByGroupIndex';
import VisibleActionGroupByStepIdIndex from './indexes/VisibleActionGroupByStepIdIndex';
import StepsByTypeIndex from './indexes/StepsByTypeIndex';
import StepsByGroupIndex from './indexes/StepsByGroupIndex';
import TestRun from './TestRun';
import LogFileLoader from './LogFileLoader';
import VisitedStaticTracesByFile from './indexes/VisitedStaticTracesByFileIndex';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError, trace: logTrace } = newLogger('PathwaysDataProvider');

/** @typedef {import('@dbux/data/src/pathways/UserAction').default} UserAction */
/** @typedef {import('@dbux/data/src/applications/Application').default} Application */
/** @typedef {import('../projectLib/Exercise').default} Exercise */
/** @typedef {import('./TestRun').default} TestRun */

/**
 * @template T
 * @extends {Collection<T>}
 */
class PathwaysCollection extends Collection {
  handleAdd(entry) {
    entry._id = this._all.length;
  }
}

/**
 * @extends {PathwaysCollection<TestRun>}
 */
class TestRunCollection extends PathwaysCollection {
  constructor(pdp) {
    super('testRuns', pdp);
  }
}

/**
 * @extends {PathwaysCollection<Application>}
 */
class ApplicationCollection extends PathwaysCollection {
  constructor(pdp) {
    super('applications', pdp);
    this.addedApplicationUUIDs = new Set();
  }

  isApplicationAdded(app) {
    return this.addedApplicationUUIDs.has(app.uuid);
  }

  /**
   * @param {Array<Application>} applications 
   */
  postAddRaw(applications) {
    this.handleApplicationAdded(applications);
    this.dp.updateIndexFile();
  }

  handleApplicationAdded(apps) {
    for (const app of apps) {
      app.dataProvider.onAnyData(data => {
        this.handleDataAdded(app, data);
      });

      this.handleDataAdded(app);
    }
  }

  handleDataAdded(app, allData = null) {
    let serializedData;
    if (allData) {
      serializedData = app.dataProvider.serializeJson(Object.entries(allData));
    }
    else {
      serializedData = app.dataProvider.serializeJson();
    }

    const filePath = this.dp.session.getApplicationFilePath(app.uuid);
    if (!fs.existsSync(filePath)) {
      const header = JSON.stringify({ headerTag: true });
      fs.appendFileSync(filePath, `${header}\n`, { flag: 'ax' });
    }

    fs.appendFileSync(filePath, `${JSON.stringify(serializedData)}\n`);
  }

  postAddProcessed(apps) {
    for (const app of apps) {
      this.addedApplicationUUIDs.add(app.uuid);
    }
  }

  /**
   * @param {Application} application 
   */
  serialize(application) {
    return extractApplicationData(application);
  }

  async deserialize(appData) {
    let app;
    const { uuid } = appData;
    const appFilePath = this.dp.session.getApplicationFilePath(uuid);
    this.addedApplicationUUIDs.add(uuid);
    try {
      const fileString = fs.readFileSync(appFilePath, 'utf8');
      const [header, ...lines] = fileString.split(/\r?\n/);
      const allDpData = lines.filter(l => !!l).map(line => JSON.parse(line));
      app = await importApplication(appData, allDpData);
    }
    catch (err) {
      if (err.code === 'ENOENT') {
        logError(`Cannot recover application: log file not found at ${appFilePath}`);
      }
      throw err;
    }
    return app;
  }
}

/**
 * @extends {PathwaysCollection<UserAction>}
 */
class UserActionCollection extends PathwaysCollection {
  constructor(pdp) {
    super('userActions', pdp);
  }

  postAddProcessed(userActions) {
    this.resolveVisitedStaticTracesIndex(userActions);
  }

  /**
   * NOTE: This is used in `decorateVisitedTraces` in `pathwaysDecorations.js`
   * @param {UserAction[]} userActions 
   * @returns 
   */
  resolveVisitedStaticTracesIndex(userActions) {
    const warnedApplications = new Set();
    for (const action of userActions) {
      const { trace } = action;
      if (!trace) {
        continue;
      }

      const { applicationId, staticTraceId } = trace;
      const app = allApplications.getById(applicationId);
      if (!app) {
        if (!warnedApplications.has(applicationId)) {
          this.logger.warn(`Could not find application of trace #${trace.traceId}: applicationId=${applicationId}`);
          warnedApplications.add(applicationId);
        }
        continue;
      }
      const dp = app.dataProvider;

      const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
      const { staticContextId } = staticTrace;
      const { programId } = dp.collections.staticContexts.getById(staticContextId);
      const fpath = programId && dp.collections.staticProgramContexts.getById(programId).filePath || '(unknown file)';

      // this.dp === pdp
      this.dp.indexes.userActions.visitedStaticTracesByFile.addEntryToKey(fpath, staticTrace);
    }
  }

  serialize(action) {
    action = { ...action };
    if (isCodeActionTypes(action.type)) {
      action.file = pathRelative(allApplications.appRoot, action.file);
    }
    return action;
  }

  deserialize(action) {
    if (isCodeActionTypes(action.type)) {
      action.file = pathJoin(allApplications.appRoot, action.file);
    }
    return action;
  }
}

/**
 * @extends {PathwaysCollection<Step>}
 */
class StepCollection extends PathwaysCollection {
  groupIdsByKey = new Map();

  constructor(pdp) {
    super('steps', pdp);
  }

  postAddProcessed(steps) {
    this.resolveStepGroupId(steps);
  }

  resolveStepGroupId(steps) {
    for (const step of steps) {
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
}

/**
 * @extends {PathwaysCollection<ActionGroup>}
 */
class ActionGroupCollection extends PathwaysCollection {
  constructor(pdp) {
    super('actionGroups', pdp);
  }
}

export default class PathwaysDataProvider extends DataProviderBase {
  /**
   * @type {PathwaysDataUtil}
   */
  util;

  // stepsByStaticContextId = new Map();

  constructor(session) {
    super('PathwaysDataProvider');
    this.session = session;
    this.version = 2;

    this.util = Object.fromEntries(
      Object.keys(PathwaysDataUtil).map(name => [name, PathwaysDataUtil[name].bind(null, this)])
    );

    this.reset();
  }

  get sessionId() {
    return this.session.sessionId;
  }

  get logFilePath() {
    return this.session.logFilePath;
  }

  // ###########################################################################
  // Public add/edit data
  // ###########################################################################

  /**
   * @param {Exercise} exercise 
   * @param {number} nFailedTests
   * @param {string} patchString 
   * @param {Application[]} apps applications of this TestRun
   * @return {TestRun}
   */
  addTestRun(exercise, nFailedTests, patchString, apps) {
    const appUUIDs = apps.map(app => app.uuid);
    const testRun = new TestRun(exercise, nFailedTests, patchString, appUUIDs);
    this.addData({ testRuns: [testRun] });

    emitNewTestRun(testRun);

    return testRun;
  }

  /**
   * @param {Application[]} apps 
   */
  addApplications(apps) {
    if (apps?.length) {
      emitNewApplicationsAction(apps);
      this.addData({ applications: apps });
    }
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
      exerciseId,
      type: actionType,
      createdAt,
      trace
    } = firstAction;

    const type = getStepTypeByActionType(actionType);
    const contextId = trace?.contextId;
    const firstTraceId = trace?.traceId;

    const step = {
      sessionId,
      exerciseId,
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
    const { _id: stepId } = step;
    // const { _id: actionId } = firstAction;
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
    action.stepId = step._id;

    // actionGroup
    const lastActionGroup = this.collections.actionGroups.getLast();
    let actionGroup = lastActionGroup;
    if (!lastActionGroup || lastStep !== step || !this.util.shouldClumpNextActionIntoGroup(action, lastActionGroup)) {
      // create new group
      actionGroup = this.addNewGroup(step, action, writeToLog);
    }
    action.groupId = actionGroup._id;

    // add action
    this.addData({ userActions: [action] }, writeToLog);
  }

  shouldAddNewStep(action) {
    // NOTE: action._id is not set yet (will be set during `addData`)
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
  async init() {
    this.reset();

    if (fs.existsSync(this.logFilePath)) {
      await this.load();
    }
    else {
      this.writeHeader();
    }
  }

  reset() {
    this.collections = {
      testRuns: new TestRunCollection(this),
      applications: new ApplicationCollection(this)
    };

    this.indexes = new Indexes();
    this.addIndex(new TestRunsByExerciseIdIndex());

    this._resetUserActions();
  }

  _resetUserActions() {
    this.collections = {
      ...this.collections,

      steps: new StepCollection(this),
      actionGroups: new ActionGroupCollection(this),
      userActions: new UserActionCollection(this),
    };

    this.addIndex(new UserActionByTypeIndex());
    this.addIndex(new UserActionsByStepIndex());
    this.addIndex(new UserActionsByGroupIndex());
    this.addIndex(new VisibleActionGroupByStepIdIndex());
    this.addIndex(new VisitedStaticTracesByFile());
    this.addIndex(new StepsByGroupIndex());
    this.addIndex(new StepsByTypeIndex());
  }

  async clearSteps() {
    this._resetUserActions();
    fs.unlinkSync(this.logFilePath);

    this.writeHeader();
    this.writeData(
      Object.fromEntries(['testRuns', 'applications'].
        map(name => this.collections[name]).
        map(collection => [collection.name, Array.from(collection)])
      )
    );

    this._notifyData(EmptyArray, EmptyObject);
  }

  /**
   * Load data from log file
   */
  async load() {
    try {
      let [headerString, ...lines] = fs.readFileSync(this.logFilePath, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        if (line) {
          const data = JSON.parse(line);
          await this.deserializeJson(data);
        }
      }
    }
    catch (err) {
      if (err.code === 'ENOENT') {
        logError(`[load] No log file found at "${this.logFilePath}"`);
      }
      else {
        throw new NestedError(`PathwaysDataProvider failed to load from log file`, err);
      }
    }
  }

  loadByVersion = Object.fromEntries(
    Object.entries(LogFileLoader).map(([name, func]) => [name, func.bind(this)])
  );

  addData(allData, isRaw = true) {
    // TODO: remove this override, and do log writting by listener maybe?
    super.addData(allData, isRaw);

    if (isRaw) {
      this.writeData(allData);
    }
  }

  writeData(data) {
    const dataString = JSON.stringify(this.serializeJson(Object.entries(data)));
    fs.appendFileSync(this.logFilePath, `${dataString}\n`, { flag: 'a' });
  }

  writeHeader() {
    const { version, logFilePath } = this;
    const { sessionId, createdAt, exerciseId = null } = this.session;
    fs.appendFileSync(logFilePath, `${JSON.stringify({ headerTag: true, version, sessionId, exerciseId, createdAt })}\n`, { flag: 'ax' });
    this.updateIndexFile();
  }

  static async parseHeader(filePath) {
    const firstLine = await getFirstLine(filePath);
    const header = JSON.parse(firstLine);
    if (!header.headerTag) {
      throw new Error('No header information in log file');
    }
    return header;
  }

  updateIndexFile() {
    const { exercise } = this.session;
    const { sessionId } = this;
    if (exercise) {
      const indexFilePath = this.session.getExerciseIndexFilePath(exercise);
      let index;
      if (fs.existsSync(indexFilePath)) {
        index = JSON.parse(fs.readFileSync(indexFilePath, 'utf-8'));
      }
      else {
        index = {};
      }
      index[sessionId] = this.makeSessionIndex();
      fs.writeFileSync(indexFilePath, JSON.stringify(index, null, 2));
    }
  }

  makeSessionIndex() {
    const { sessionId } = this;
    return {
      sessionId,
      applicationIds: this.collections.applications.getAllActual().map(app => app.uuid)
    };
  }
}