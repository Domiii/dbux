import path from 'path';
import { pathRelative } from '@dbux/common-node/src/util/pathUtil';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import { deleteCachedLocRange } from '@dbux/data/src/util/misc';
import DataFlowFilterModeType from './dataFlowView/DataFlowFilterModeType';
import DataFlowSearchModeType from './dataFlowView/DataFlowSearchModeType';
import PackageNodeSortMode from './globalAnalysisView/nodes/PackageNodeSortMode';

/** @typedef {import('@dbux/common/src/types/Loc').default} Loc */
/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */
/** @typedef {import('@dbux/common/src/types/StaticContext.default} StaticContext */
/** @typedef {import('@dbux/common/src/types/StaticTrace').default} StaticTrace */
/** @typedef {import('@dbux/projects/src/ProjectsManager').ProjectsManager}  */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('UserActions');

// ###########################################################################
// register `ProjectsManager`
// ###########################################################################

/**
 * @type {ProjectsManager}
 */
let manager;

export function initUserAction(_manager) {
  manager = _manager;
}

// ###########################################################################
// basic events registry
// ###########################################################################

/**
 * The most basic `UserActions`, which contains no location nor trace
 */
export function emitBasicUserAction(actionType, data) {
  emitUserAction(actionType, data);
}

/**
 * `UserActions` that related to some 'file' & 'location'
 */
export function emitLocUserAction(actionType, file, range, moreProp) {
  emitBasicUserAction(actionType, { file, range, ...moreProp });
}

/**
 * `UserActions` that related to some trace, we use the information to find the related location
 */
export function emitTraceUserAction(actionType, trace, moreProp = EmptyObject) {
  const moreTraceInfo = makeTraceStaticInformation(trace);
  emitUserAction(actionType, {
    trace,
    ...moreTraceInfo,
    ...moreProp
  });
}

/** ###########################################################################
 * helpers
 *  #########################################################################*/

/** ########################################
 * DataFlowView
 *  ######################################*/

export function emitDataFlowViewSearchModeChangedAction(mode) {
  const modeName = DataFlowSearchModeType.nameFromForce(mode);
  emitBasicUserAction(UserActionType.DataFlowViewSearchModeChanged, { mode, modeName });
}

export function emitDataFlowViewFilterModeChangedAction(mode) {
  const modeName = DataFlowFilterModeType.nameFromForce(mode);
  emitBasicUserAction(UserActionType.DataFlowViewFilterModeChanged, { mode, modeName });
}

/** ########################################
 * GlobalAnalysisView
 *  ######################################*/

export function emitGlobalPackageSortModeChangedAction(mode) {
  const modeName = PackageNodeSortMode.nameFromForce(mode);
  emitBasicUserAction(UserActionType.GlobalPackageSortModeChanged, { mode, modeName });
}

/** ########################################
 * TDView
 *  ######################################*/

export function emitTDExecutionGroupModeChangedAction(modeLabel) {
  emitBasicUserAction(UserActionType.TDExecutionsGroupModeChanged, { modeLabel });
}

export function emitValueRenderAction(value, nodeId) {
  emitBasicUserAction(UserActionType.TDValueRender, { value, nodeId });
}

/** ########################################
 * dbux-project
 *  ######################################*/

export function emitStopRunnerAction() {
  emitBasicUserAction(UserActionType.StopProjectRunner);
}

export function emitShowHideProjectViewsAction(isShowing) {
  emitBasicUserAction(UserActionType.ProjectViewsVisibilityChanged, { isShowing });
}

export function emitTagTraceAction(trace) {
  emitTraceUserAction(UserActionType.TagTrace, trace);
}

export function emitAnnotateTraceAction(actionType, trace, annotation) {
  emitTraceUserAction(actionType, trace, { annotation });
}

export function emitProjectViewListModeChanged(byChapterMode) {
  const modeName = byChapterMode ? 'byChapter' : 'byProject';
  emitBasicUserAction(UserActionType.ProjectViewListModeChanged, { byChapterMode, modeName });
}

export function emitOpenWebsiteAction(exerciseId, url) {
  emitBasicUserAction(UserActionType.OpenWebsite, { exerciseId, url });
}

export function emitShowExerciseIntroductionViewAction(exercise) {
  emitBasicUserAction(UserActionType.ShowExerciseIntroductionView, { exerciseId: exercise.id });
}

/** ########################################
 * misc
 *  ######################################*/

export function emitRunFileAction(filePath, debugMode) {
  const fileName = path.basename(filePath);
  emitBasicUserAction(UserActionType.RunFile, { fileName, debugMode });
}

export function emitRuntimeServerStatusChangedAction(isOn) {
  emitBasicUserAction(UserActionType.RuntimeServerStatusChanged, { isOn });
}

export function emitShowHelpAction() {
  emitBasicUserAction(UserActionType.ShowHelp);
}

export function emitShowOutputChannelAction() {
  emitBasicUserAction(UserActionType.ShowOutputChannel);
}

export function emitShowHideDecorationAction(isShowing) {
  emitBasicUserAction(UserActionType.DecorationVisibilityChanged, { isShowing });
}

export function emitShowHideNavBarButtonsAction(isShowing) {
  emitBasicUserAction(UserActionType.NavBarButtonsVisibilityChanged, { isShowing });
}

export function emitShowHideErrorLogNotificationAction(isShowing) {
  emitBasicUserAction(UserActionType.ErrorLogNotificationVisibilityChanged, { isShowing });
}

/**
 * NOTE: For editor events e.g. `EditorSelectionChanged`
 */
export function emitEditorAction(actionType, { file, range, trace }, extraEditorEventInfo) {
  if (trace) {
    emitTraceUserAction(actionType, trace, extraEditorEventInfo);
  }
  else {
    emitLocUserAction(actionType, file, range, extraEditorEventInfo);
  }
}

export function emitNavigationAction(trace, navigationMethodName) {
  const actionTypeName = `Navigation${navigationMethodName}`;
  const actionType = UserActionType.valueFromForce(actionTypeName);

  emitTraceUserAction(actionType, trace);
}

export function emitShowApplicationEntryFileAction(app, entryPointPath) {
  const filePath = pathRelative(app.getAppCommonAncestorPath(), entryPointPath);
  emitBasicUserAction(UserActionType.ShowApplicationEntryFile, { filePath });
}

export function emitTreeViewAction(treeViewName, nodeId, nodeLabel, userActionType, args) {
  emitBasicUserAction(userActionType || UserActionType.TreeViewOther, {
    treeViewName,
    nodeId,
    nodeLabel,
    args
  });
}

export function emitTreeViewCollapseChangeAction(treeViewName, nodeId, nodeLabel, userActionType, args) {
  emitBasicUserAction(userActionType || UserActionType.TreeViewCollapseChangeOther, {
    treeViewName,
    nodeId,
    nodeLabel,
    args
  });
}

export function emitCallGraphAction(actionType, data) {
  emitBasicUserAction(actionType, data);
}

export function emitCallGraphTraceAction(actionType, trace, moreProp) {
  emitTraceUserAction(actionType, trace, moreProp);
}

export function emitPathwaysAction(actionType, data) {
  emitBasicUserAction(actionType, data);
}

// ###########################################################################
// Util
// ###########################################################################

/**
 * 
 * @param {Trace} trace 
 * @returns {{applicationId: number, file: string, staticContext: StaticContext, staticTrace: StaticTrace}}
 */
function makeTraceStaticInformation(trace) {
  const { applicationId, traceId, staticTraceId } = trace;

  const app = allApplications.getById(applicationId);
  const dp = app.dataProvider;
  const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
  const staticContext = { ...dp.util.getTraceStaticContext(traceId) };
  const { filePath: file } = dp.collections.staticProgramContexts.getById(staticContext.programId);
  deleteCachedLocRange(staticContext.loc);
  return {
    applicationId,
    file,
    staticContext,
    staticTrace,
  };
}

// ###########################################################################
// emitter
// ###########################################################################

/**
 * NOTE: Basic UserAction emitter, should not be used without registration
 * @param {string} name 
 * @param {Object} [data] NOTE: data *must* always be completely serializable, simple data.
 */
function emitUserAction(name, data) {
  manager?.emitUserAction(name, data);
}
