import {
  ViewColumn
} from 'vscode';
import DDGHost from '@dbux/graph-host/src/DDGHost';
import DataDependencyGraph from '@dbux/data/src/ddg/DataDependencyGraph';
import traceSelection from '@dbux/data/src/traceSelection';
import allApplications from '@dbux/data/src/applications/allApplications';
import { getThemeResourcePathUri } from '../codeUtil/codePath';
import RichWebView from './RichWebView';


const defaultColumn = ViewColumn.Two;

export default class DataDependencyGraphWebView extends RichWebView {
  constructor(mainComponentInitialState, mainComponentHostOnlyState) {
    super(DDGHost, 'dbux-data-graph', defaultColumn, mainComponentInitialState, mainComponentHostOnlyState);
  }

  getIcon() {
    return getThemeResourcePathUri('dependency.svg');
  }

  getMainScriptPath() {
    return 'dist/web/ddg.client.js';
  }

  // /** ###########################################################################
  //  * life-time events
  //  *  #########################################################################*/

  // /**
  //  * Provide custom inital state to MainComponent (`DDGDocument`)
  //  */
  // makeInitialState() {

  // }

  /** ###########################################################################
   * ddg-specific externals
   *  #########################################################################*/

  externals = {

  }
}

/**
 * @type {Map.<DataDependencyGraph, DataDependencyGraphWebView>}
 */
let activeWebviews = new Map();

export function disposeDDGWebviews() {
  Array.from(activeWebviews.values()).forEach(w => w.dispose());
  activeWebviews = new Map();
}

/**
 * @return {DataDependencyGraphWebView} ddg 
 */
export function getDDGWebview(ddg) {
  return activeWebviews.get(ddg);
}

export async function getDDGDot(ddg) {
  if (!ddg && activeWebviews.size === 1) {
    ddg = activeWebviews.keys().next().value;
  }
  const webview = getDDGWebview(ddg);
  if (webview) {
    const doc = webview.hostWrapper.mainComponent;
    const timelineView = doc.children.getComponent('DDGTimelineView');
    return await timelineView.remote.buildDot();
  }
  return null;
}

export async function showDDGViewForContextOfSelectedTrace() {
  let initialState;
  let hostOnlyState;
  let trace = traceSelection.selected;
  let ddg;
  if (trace) {
    const { applicationId, contextId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    // const context = dp.collections.executionContexts.getById(contextId);
    const ddgArgs = { applicationId, contextId };
    const failureReason = dp.ddgs.getCreateDDGFailureReason(ddgArgs);
    if (failureReason) {
      initialState = makeFailureState(failureReason);
    }
    else {
      ddg = dp.ddgs.getOrCreateDDGForContext(ddgArgs);
      initialState = makeGraphState(ddg);
      hostOnlyState = { ddg };
    }
  }
  else {
    const failureReason = 'DDG is empty';
    initialState = makeFailureState(failureReason);
  }

  return await showDDGView(ddg, initialState, hostOnlyState);
}

/**
 * @param {DataDependencyGraph} ddg 
 */
function makeGraphState(ddg) {
  // reset status message
  const failureReason = null;
  const { applicationId } = ddg.dp.application;

  return { failureReason, applicationId, ...ddg.getRenderData() };
}

function makeFailureState(failureReason) {
  return { failureReason, timelineNodes: null, edges: null };
}

async function showDDGView(ddg, ddgDocumentInitialState, hostOnlyState) {
  // TODO: select correct window, based on initial state
  const dDGWebView = await initDDGView(ddg, ddgDocumentInitialState, hostOnlyState);
  await dDGWebView.show();
  // TODO: add new action type
  // emitCallGraphAction(UserActionType.CallGraphVisibilityChanged, { isShowing: true });
  return dDGWebView;
}

async function initDDGView(ddg, ddgDocumentInitialState, hostOnlyState) {
  const dDGWebView = new DataDependencyGraphWebView(ddgDocumentInitialState, hostOnlyState);
  await dDGWebView.init();
  activeWebviews.set(ddg, dDGWebView);
  return dDGWebView;
}