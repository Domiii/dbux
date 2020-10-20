import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';

/**
 * @file Here we export `ProjectsManager.emitUserEvent` such that you can emit events everywhere in dbux-code
 */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('UserEvents');

// ###########################################################################
// register ProjectsManager
// ###########################################################################

let manager;

export function initUserEvent(_manager) {
  manager = _manager;
}

// ###########################################################################
// events registry
// ###########################################################################

export function emitEditorAction(evtName, data) {
  emitUserEvent(UserActionType.EditorEvent, {
    eventType: evtName,
    ...data
  });
}

export function emitNavigationAction(actionName, selectMethod, trace) {
  const actionTypeName = `Navigation${actionName}`;
  const actionType = UserActionType.valueFromForce(actionTypeName);

  emitUserEvent(actionType, {
    selectMethod,
    trace,
    applicationUUID: getApplicationUUID(trace),
    locationInfo: getExtraTraceLocationImformation(trace)
  });
}

export function emitPracticeSelectTraceAction(selectMethod, trace, actionType = UserActionType.SelectTrace) {
  emitUserEvent(actionType, {
    selectMethod,
    trace,
    applicationUUID: getApplicationUUID(trace),
    locationInfo: getExtraTraceLocationImformation(trace)
  });
}

export function emitTagTraceAction(trace) {
  emitUserEvent(UserActionType.TagTrace, {
    trace,
    locationInfo: getExtraTraceLocationImformation(trace)
  });
}

export function emitTreeViewAction(treeViewName, action, nodeId, nodeLabel, userActionType, args) {
  emitUserEvent(userActionType || UserActionType.TreeViewOther, {
    treeViewName,
    action,
    nodeId,
    nodeLabel,
    args
  });
}

export function emitTreeViewCollapseChangeAction(treeViewName, action, nodeId, nodeLabel, userActionType, args) {
  emitUserEvent(userActionType || UserActionType.TreeViewCollapseChangeOther, {
    treeViewName,
    action,
    nodeId,
    nodeLabel,
    args
  });
}

export function emitCallGraphAction(evtType, data) {
  emitUserEvent(evtType, data);
}

// ###########################################################################
// Util
// ###########################################################################

function getExtraTraceLocationImformation(trace) {
  const { applicationId, traceId, staticTraceId } = trace;
  const dp = allApplications.getById(applicationId).dataProvider;

  const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
  const staticContext = dp.collections.staticContexts.getById(staticTrace.staticContextId);
  const filePath = dp.util.getTraceFilePath(traceId);
  return {
    filePath,
    staticTrace,
    staticContext,
    staticTraceIndex: trace.staticTraceIndex
  };
}

function getApplicationUUID(trace) {
  return allApplications.getById(trace.applicationId).uuid;
}

// ###########################################################################
// emitter
// ###########################################################################

export function onUserEvent(cb) {
  if (!manager) {
    throw new Error('trying to listen on userEvent before ProjectsManager is registered');
  }
  return manager.onUserEvent(cb);
}

/**
 * 
 * @param {string} name 
 * @param {Object} data NOTE: data *must* always be completely serializable, simple data.
 */
function emitUserEvent(name, data) {
  manager?.emitUserEvent(name, data);
}