import {
  ViewColumn
} from 'vscode';
import fs from 'fs';
import { dirname } from 'path';
import open from 'open';
import DDGHost from '@dbux/graph-host/src/DDGHost';
import DataDependencyGraph from '@dbux/data/src/ddg/DataDependencyGraph';
import traceSelection from '@dbux/data/src/traceSelection';
import allApplications from '@dbux/data/src/applications/allApplications';
import { getThemeResourcePathUri, getDefaultExportDirectory } from '../codeUtil/codePath';
import { setTestDDGArgs } from '../testUtil';
import { confirm, showInformationMessage } from '../codeUtil/codeModals';
import { translate } from '../lang';
import RichWebView from './RichWebView';


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
    getDefaultExportDirectory,
    saveFile: async (filePath, data) => {
      if (fs.existsSync(filePath)) {
        const result = await confirm(`File "${filePath}" already exists, do you want to override?`);
        if (!result) {
          return;
        }
      }

      const folderPath = dirname(filePath);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }
      fs.writeFileSync(filePath, data);
      const msg = translate('savedSuccessfully', { fileName: filePath });
      await showInformationMessage(msg, {
        async 'Show File'() {
          await open(folderPath);
        }
      });
    }
  }
}

/**
 * @type {Map.<DataDependencyGraph, DataDependencyGraphWebView>}
 */
let activeWebviews = new Map();

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

/** ###########################################################################
 * show + init
 * ##########################################################################*/

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
    hostOnlyState = {};
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

/**
 * @param {DataDependencyGraph} ddg 
 */
async function showDDGView(ddg, ddgDocumentInitialState, hostOnlyState) {
  // TODO: we currently don't close window if DDG is gone from set, but this way, it will be out of sync with DDGs treeview

  // future-work: select correct window, based on initial state
  const dDGWebView = new DataDependencyGraphWebView(ddg, ddgDocumentInitialState, hostOnlyState);
  await dDGWebView.init();
  await dDGWebView.show();
  // pathways-todo: add new action type
  // emitCallGraphAction(UserActionType.CallGraphVisibilityChanged, { isShowing: true });
  activeWebviews.set(ddg, dDGWebView);
  dDGWebView.onDispose(() => {
    ddg.ddgSet.remove(ddg);
  });
  // ddg.ddgSet.onSetChanged(() => {
  //   if (!ddg.ddgSet.contains(ddg)) {
  //     // ddg got removed → clean up?
  //   }
  // });
  return dDGWebView;
}

/** ###########################################################################
 * public control functions
 * future-work: make this non-global?
 * ##########################################################################*/

export function getActiveDDGWebview() {
  return Array.from(activeWebviews.values()).find(w => w.isVisible);
}


export function disposeDDGWebviews() {
  Array.from(activeWebviews.values()).forEach(w => w.dispose());
  activeWebviews = new Map();
}
