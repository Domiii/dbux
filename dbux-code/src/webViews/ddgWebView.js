import {
  ViewColumn
} from 'vscode';
import DDGHost from '@dbux/graph-host/src/DDGHost';
import DataDependencyGraph from '@dbux/data/src/ddg/DataDependencyGraph';
import traceSelection from '@dbux/data/src/traceSelection';
import allApplications from '@dbux/data/src/applications/allApplications';
import { getThemeResourcePathUri } from '../codeUtil/codePath';
import RichWebView from './RichWebView';
import { setTestDDGArgs } from '../testUtil';


const defaultColumn = ViewColumn.Two;

export default class DataDependencyGraphWebView extends RichWebView {
  /**
   * @param {DataDependencyGraph} ddg 
   */
  constructor(ddg, mainComponentInitialState, mainComponentHostOnlyState) {
    super(DDGHost, 'dbux-data-graph', defaultColumn, mainComponentInitialState, mainComponentHostOnlyState);
    this.ddg = ddg;
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
  if (trace) {
    const { applicationId, contextId } = trace;
    // const context = dp.collections.executionContexts.getById(contextId);
    const ddgArgs = { applicationId, contextId };
    return await showDDGViewForArgs(ddgArgs);
  }
  else {
    const failureReason = 'DDG is empty';
    initialState = makeFailureState(failureReason);
    return await showDDGView(initialState, hostOnlyState);
  }
}

export async function showDDGViewForArgs(ddgArgs) {
  let { applicationUuid, applicationId } = ddgArgs;
  if (!applicationUuid) {
    if (!applicationId) {
      throw new Error(`no application given`);
    }
    applicationUuid = allApplications.getById(applicationId)?.uuid;
  }
  const app = allApplications.getById(applicationUuid);
  if (!app) {
    throw new Error(`applicationId not found`);
  }
  const dp = app.dataProvider;
  const failureReason = dp.ddgs.getCreateDDGFailureReason(ddgArgs);

  let initialState;
  let hostOnlyState;
  let ddg;
  if (failureReason) {
    initialState = makeFailureState(failureReason);
  }
  else {
    ddg = dp.ddgs.getOrCreateDDG(ddgArgs);
    initialState = makeGraphState(ddg);
    hostOnlyState = { ddg };
  }

  // this worked! Hooray! → update memento (and hope that app is already exported)
  const testFilePath = app.getDefaultApplicationExportPath();
  testFilePath && await setTestDDGArgs({ testFilePath, ...ddgArgs, applicationUuid });


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
  // future-work: select correct window, based on initial state
  const dDGWebView = await initDDGView(ddg, ddgDocumentInitialState, hostOnlyState);
  await dDGWebView.show();
  // TODO: add new action type
  // emitCallGraphAction(UserActionType.CallGraphVisibilityChanged, { isShowing: true });
  return dDGWebView;
}

async function initDDGView(ddg, ddgDocumentInitialState, hostOnlyState) {
  const dDGWebView = new DataDependencyGraphWebView(ddg, ddgDocumentInitialState, hostOnlyState);
  await dDGWebView.init();
  activeWebviews.set(ddg, dDGWebView);
  return dDGWebView;
}

export function getActiveDDGWebview() {
  return Array.from(activeWebviews.values()).find(w => w.isVisible);
}
