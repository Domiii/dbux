/**
 * @file Here we export `ProjectsManager.emitUserEvent` such that you can emit events everywhere in dbux-code
 */

import { pathRelative } from '@dbux/common-node/src/util/pathUtil';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import PackageNodeSortMode from './globalAnalysisView/nodes/PackageNodeSortMode';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('UserEvents');

// ###########################################################################
// register `ProjectsManager`
// ###########################################################################

let manager;

export function initUserEvent(_manager) {
  manager = _manager;
}

// ###########################################################################
// events registry
// ###########################################################################

/**
 * NOTE: Register every possible UserActions here, so we can manage them all together
 */
export function emitUserAction(actionType, data) {
  emitUserEvent(actionType, data);
}

/** ########################################
 * trace selection
 *  ######################################*/

export function emitShowErrorAction(errorTrace) {
  emitUserEvent(UserActionType.ShowError, { errorTrace });
}

export function emitSelectTraceAction(trace, actionType = UserActionType.SelectTrace, moreProp) {
  emitUserEvent(actionType, {
    trace,
    applicationUUID: getApplicationUUID(trace),
    locationInfo: getExtraTraceLocationImformation(trace),
    ...moreProp
  });
}

/** ########################################
 * DataFlowView
 *  ######################################*/

export function emitDataFlowViewSearchModeChangedAction(searchMode) {
  emitUserEvent(UserActionType.DataFlowViewSearchModeChanged, { searchMode });
}

export function emitDataFlowViewFilterModeChangedAction(filterMode) {
  emitUserEvent(UserActionType.DataFlowViewFilterModeChanged, { filterMode });
}

/** ########################################
 * GlobalAnalysisView
 *  ######################################*/

export function emitGlobalPackageSortModeChangedAction(mode) {
  const modeName = PackageNodeSortMode.nameFromForce(mode);
  emitUserEvent(UserActionType.GlobalPackageSortModeChanged, { mode, modeName });
}

/** ########################################
 * TDView
 *  ######################################*/

export function emitTDExecutionGroupModeChangedAction(modeLabel) {
  emitUserEvent(UserActionType.TDExecutionsGroupModeChanged, { modeLabel });
}

export function emitValueRenderAction(value, nodeId) {
  emitUserEvent(UserActionType.TDValueRender, { value, nodeId });
}

/** ########################################
 * dbux-project
 *  ######################################*/

export function emitStopRunnerAction() {
  emitUserEvent(UserActionType.StopProjectRunner);
}

export function emitShowHideProjectViewsAction(isShowing) {
  emitUserEvent(UserActionType.ProjectViewsVisibilityChanged, { isShowing });
}

export function emitTagTraceAction(trace, actionType) {
  emitUserEvent(actionType || UserActionType.TagTrace, {
    trace,
    locationInfo: getExtraTraceLocationImformation(trace)
  });
}

export function emitAnnotateTraceAction(type, trace, s) {
  emitUserEvent(type, {
    annotation: s,
    trace,
    locationInfo: getExtraTraceLocationImformation(trace)
  });
}

export function emitProjectViewListModeChanged(isByChapter) {
  emitUserEvent(UserActionType.ProjectViewListModeChanged, { modeName: isByChapter ? 'byChapter' : 'byProject' });
}

export function emitOpenWebsiteAction(url) {
  emitUserEvent(UserActionType.OpenWebsite, { url });
}

export function showExerciseIntroductionView(exercise) {
  emitUserEvent(UserActionType.ShowExerciseIntroductionView, { exerciseId: exercise.id });
}

/** ########################################
 * misc
 *  ######################################*/

export function emitRunFileAction(filePath, debugMode) {
  emitUserEvent(UserActionType.RunFile, { filePath, debugMode });
}

export function emitRuntimeServerStatusChangedAction(isOn) {
  emitUserEvent(UserActionType.RuntimeServerStatusChanged, { isOn });
}

export function emitShowHelpAction() {
  emitUserEvent(UserActionType.ShowHelp);
}

export function emitShowOutputChannelAction() {
  emitUserEvent(UserActionType.ShowOutputChannel);
}

export function emitShowHideDecorationAction(isShowing) {
  emitUserEvent(UserActionType.DecorationVisibilityChanged, { isShowing });
}

export function emitShowHideNavBarButtonsAction(isShowing) {
  emitUserEvent(UserActionType.NavBarButtonsVisibilityChanged, { isShowing });
}

export function emitShowHideErrorLogNotificationAction(isShowing) {
  emitUserEvent(UserActionType.ErrorLogNotificationVisibilityChanged, { isShowing });
}

/**
 * NOTE: For editor events e.g. `EditorSelectionChanged`
 */
export function emitEditorAction(type, data) {
  emitUserEvent(type, data);
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

export function emitShowApplicationEntryFileAction(filePath) {
  emitUserEvent(UserActionType.ShowApplicationEntryFile, { filePath });
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

export function emitPathwaysAction(evtType, data) {
  emitUserEvent(evtType, data);
}

// ###########################################################################
// Util
// ###########################################################################

function getExtraTraceLocationImformation(trace) {
  const { applicationId, traceId, staticTraceId, staticTraceIndex } = trace;
  const dp = allApplications.getById(applicationId).dataProvider;

  const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
  const staticContext = dp.collections.staticContexts.getById(staticTrace.staticContextId);
  const filePath = pathRelative(allApplications.appRoot, dp.util.getTraceFilePath(traceId));
  return {
    filePath,
    staticTrace,
    staticContext,
    staticTraceIndex
  };
}

function getApplicationUUID(trace) {
  return allApplications.getById(trace.applicationId).uuid;
}

// ###########################################################################
// emitter
// ###########################################################################

// export function onUserEvent(cb) {
//   if (!manager) {
//     throw new Error('trying to listen on userEvent before ProjectsManager is registered');
//   }
//   return manager.onUserEvent(cb);
// }

/**
 * NOTE: Basic UserAction emitter, should not be used without registration
 * @param {string} name 
 * @param {Object} [data] NOTE: data *must* always be completely serializable, simple data.
 */
function emitUserEvent(name, data) {
  manager?.emitUserEvent(name, data);
}
