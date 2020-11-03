import fs from 'fs';
import path from 'path';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import DataProviderBase from '@dbux/data/src/DataProviderBase';
import Collection from '@dbux/data/src/Collection';
import Indexes from '@dbux/data/src/indexes/Indexes';
import { getGroupTypeByActionType } from '@dbux/data/src/pathways/ActionGroupType';
import StepType, { getStepTypeByActionType } from '@dbux/data/src/pathways/StepType';
import PathwaysDataUtil from './pathwaysDataUtil';
import TestRunsByBugIdIndex from './indexes/TestRunsByBugIdIndex';
import UserActionByBugIdIndex from './indexes/UserActionByBugIdIndex';
import UserActionByTypeIndex from './indexes/UserActionByTypeIndex';
import UserActionsByStepIndex from './indexes/UserActionsByStepIndex';
import UserActionsByGroupIndex from './indexes/UserActionsByGroupIndex';
import StepsByGroupIndex from './indexes/StepsByGroupIndex';
import StepsByTypeIndex from './indexes/StepsByTypeIndex';

import TestRun from './TestRun';

import { emitNewTestRun } from '../userEvents';

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

      const stepGroupKey = `${type}_${staticContextId}`;
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

    this.util = Object.fromEntries(
      Object.keys(PathwaysDataUtil).map(name => [name, PathwaysDataUtil[name].bind(null, this)])
    );

    this.logFolderPath = manager.externals.resources.getLogsDirectory();
    if (!fs.existsSync(this.logFolderPath)) {
      fs.mkdirSync(this.logFolderPath);
    }

    this.reset();
  }

  reset() {
    this.collections = {
      testRuns: new TestRunCollection(this),
      applications: new ApplicationCollection(this),
      steps: new StepCollection(this),
      actionGroups: new ActionGroupCollection(this),
      userActions: new UserActionCollection(this),
    };

    this.indexes = new Indexes();
    this.addIndex(new TestRunsByBugIdIndex());
    this.addIndex(new UserActionByBugIdIndex());
    this.addIndex(new UserActionByTypeIndex());
    this.addIndex(new UserActionsByStepIndex());
    this.addIndex(new UserActionsByGroupIndex());
    this.addIndex(new StepsByGroupIndex());
    this.addIndex(new StepsByTypeIndex());
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

  addNewStep(applicationId, staticContextId, firstAction) {
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

    this.addData({ steps: [step] });
    return step;
  }


  addNewGroup(step, firstAction) {
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

    this.addData({ actionGroups: [group] });
    return group;
  }

  addNewUserAction(action) {
    // keep track of steps

    // NOTE: action.id is not set yet (will be set during `addData` below)
    const staticContextIds = this.util.getActionStaticContextId(action);
    const lastStep = this.collections.steps.getLast();
    const lastActionGroup = this.collections.actionGroups.getLast();
    const lastStepType = lastStep?.type || StepType.None;
    const lastStaticContextId = lastStep?.staticContextId || 0;
    const lastApplicationId = lastStep?.applicationId || 0;

    const {
      type: actionType
    } = action;
    const {
      applicationId = 0,
      staticContextId = 0,
    } = staticContextIds || EmptyObject;

    // step
    let step = lastStep;
    const stepType = getStepTypeByActionType(actionType);
    if (!lastStep ||
      action.newStep ||
      (!StepType.is.None(stepType) && lastStepType && stepType !== lastStepType) ||
      ((stepType === StepType.Trace) && (
        (applicationId && applicationId !== lastApplicationId) ||
        (staticContextId && staticContextId !== lastStaticContextId)
      ))
    ) {
      // create new step
      // let step = this.stepsByStaticContextId.get(staticContextId);
      // if (!step) {
      step = this.addNewStep(applicationId, staticContextId, action);
      // }
      // this.stepsByStaticContextId.set(staticContextId, step);
    }
    action.stepId = step.id;

    // actionGroup
    let actionGroup = lastActionGroup;
    if (!lastActionGroup || lastStep !== step || !this.util.shouldClumpNextActionIntoGroup(action, lastActionGroup)) {
      // create new group
      actionGroup = this.addNewGroup(step, action);
    }
    action.groupId = actionGroup.id;

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
  init(sessionId) {
    this.sessionId = sessionId;
    this.logFilePath = path.join(this.logFolderPath, `${sessionId}.dbuxlog`);

    this.reset();
  }

  /**
   * Load data from log file
   */
  load() {
    try {
      const allDataString = fs.readFileSync(this.logFilePath, 'utf8');
      if (allDataString) {
        const dataToAdd = Object.fromEntries(Object.keys(this.collections).map(name => [name, []]));

        for (const dataString of allDataString.split(/\r?\n/)) {
          if (dataString) {
            let { collectionName, data } = JSON.parse(dataString);
            if (this.collections[collectionName].deserialize) {
              data = this.collections[collectionName].deserialize(data);
            }
            dataToAdd[collectionName].push(data);
          }
        }

        this.addData(dataToAdd, false);
      }
    }
    catch (err) {
      if (err.code === 'ENOENT') {
        // no log file found, skip loading
      }
      else {
        logError('Failed to load from log file:', err);
        throw err;
      }
    }
  }

  addData(allData, writeToLog = true) {
    super.addData(allData);

    if (writeToLog) {
      for (const collectionName in allData) {
        for (let data of allData[collectionName]) {
          if (this.collections[collectionName].serialize) {
            data = this.collections[collectionName].serialize(data);
          }
          this.writeOnData(collectionName, data);
        }
      }
    }
  }

  /**
   * @param {string} collectionName
   */
  writeOnData(collectionName, data) {
    fs.appendFileSync(this.logFilePath, `${JSON.stringify({ collectionName, data })}\n`, { flag: 'a+' });
  }
}