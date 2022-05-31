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

let activeWebviews = [];

export function disposeDDGWebviews() {
  activeWebviews.forEach(w => w.dispose());
  activeWebviews = [];
}

export async function showDDGViewForContextOfSelectedTrace() {
  let initialState;
  let hostOnlyState;
  let trace = traceSelection.selected;
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
      const ddg = dp.ddgs.getOrCreateDDGForContext(ddgArgs);
      initialState = makeGraphState(ddg);
      hostOnlyState = { ddg };
    }
  }
  else {
    const failureReason = 'DDG is empty';
    initialState = makeFailureState(failureReason);
  }

  return await showDDGView(initialState, hostOnlyState);
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

async function showDDGView(ddgDocumentInitialState, hostOnlyState) {
  // TODO: select correct window, based on initial state
  const dDGWebView = await initDDGView(ddgDocumentInitialState, hostOnlyState);
  await dDGWebView.show();
  // TODO: add new action type
  // emitCallGraphAction(UserActionType.CallGraphVisibilityChanged, { isShowing: true });
  return dDGWebView;
}

async function initDDGView(ddgDocumentInitialState, hostOnlyState) {
  const dDGWebView = new DataDependencyGraphWebView(ddgDocumentInitialState, hostOnlyState);
  await dDGWebView.init();
  activeWebviews.push(dDGWebView);
  return dDGWebView;
}