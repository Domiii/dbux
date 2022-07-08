import {
  Uri,
  ViewColumn
} from 'vscode';
import fs from 'fs';
import { dirname } from 'path';
import open from 'open';
import PDGHost from '@dbux/graph-host/src/PDGHost';
import ProgramDependencyGraph from '@dbux/data/src/pdg/ProgramDependencyGraph';
import traceSelection from '@dbux/data/src/traceSelection';
import allApplications from '@dbux/data/src/applications/allApplications';
import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import { newLogger } from '@dbux/common/src/log/logger';
import { getThemeResourcePathUri, getDefaultExportDirectory } from '../codeUtil/codePath';
import { setTestPDGArgs } from '../testUtil';
import { confirm, showInformationMessage, showSaveDialog, showWarningMessage } from '../codeUtil/codeModals';
import { translate } from '../lang';
import RichWebView from './RichWebView';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('PDG');

const defaultColumn = ViewColumn.Two;

export default class PDGWebView extends RichWebView {
  /**
   * @param {ProgramDependencyGraph} pdg 
   */
  constructor(pdg, mainComponentInitialState, mainComponentHostOnlyState, handleStarted) {
    super(PDGHost, 'dbux-data-graph', defaultColumn, mainComponentInitialState, mainComponentHostOnlyState);
    /**
     * hackfix: add a promise-based wait method instead
     */
    this.hostWrapper.handleStarted = handleStarted;
    this.pdg = pdg;
  }

  getIcon() {
    return getThemeResourcePathUri('dependency.svg');
  }

  getMainScriptPath() {
    return 'dist/web/pdg.client.js';
  }

  // /** ###########################################################################
  //  * life-time events
  //  *  #########################################################################*/

  // /**
  //  * Provide custom inital state to MainComponent (`PDGDocument`)
  //  */
  // makeInitialState() {

  // }

  /** ###########################################################################
   * pdg-specific externals
   *  #########################################################################*/

  externals = {
    // getDefaultExportDirectory,
    saveFile: async (fname, data) => {
      // const exportFolder = this.componentManager.externals.getDefaultExportDirectory();
      // hackfix: save them right to where we need em for now
      const defaultFolder = pathResolve(process.env.DBUX_ROOT, '../scholar-scrape/writing/03-pdg/img/screens');
      let fpath = await showSaveDialog({ 
        title: 'Save Screenshot',
        filters: { svg: ['svg'] },
        defaultUri: Uri.file(defaultFolder)
      });
      if (!fpath) {
        throw new Error('cancelled');
      }
      // const exportPath = pathResolve(exportFolder, 'screenshots', `${fname}.svg`);
      if (!fpath.endsWith('.svg')) {
        fpath += '.svg';
      }
      if (fs.existsSync(fpath)) {
        const result = await confirm(`File "${fpath}" already exists, do you want to override?`);
        if (!result) {
          return;
        }
      }

      const folderPath = dirname(fpath);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }
      fs.writeFileSync(fpath, data);
      const msg = translate('savedSuccessfully', { fileName: fpath });
      await showInformationMessage(msg, {
        async 'Show File'() {
          await open(folderPath);
        }
      });
    }
  }
}

/**
 * @type {Map.<ProgramDependencyGraph, PDGWebView>}
 */
let activeWebviews = new Map();

/**
 * @return {PDGWebView} pdg 
 */
export function getPDGWebview(pdg) {
  return activeWebviews.get(pdg);
}

export async function getPDGDot(pdg) {
  if (!pdg && activeWebviews.size === 1) {
    pdg = activeWebviews.keys().next().value;
  }
  const webview = getPDGWebview(pdg);
  if (webview) {
    const doc = webview.hostWrapper.mainComponent;
    const timelineView = doc.children.getComponent('PDGTimelineView');
    await timelineView.waitForAll();
    return await timelineView.remote.buildDot();
  }
  return null;
}

/** ###########################################################################
 * show + init
 * ##########################################################################*/

export async function showPDGViewForContextOfSelectedTrace() {
  // let initialState;
  // let hostOnlyState;
  let trace = traceSelection.selected;
  if (trace) {
    const { applicationId, contextId } = trace;
    // const context = dp.collections.executionContexts.getById(contextId);
    const pdgArgs = { applicationId, contextId };
    return await showPDGViewForArgs(pdgArgs);
  }
  else {
    const message = 'In order to use the PDG, select a trace inside a function first, then try again.';
    logError(message);
    return null;
  }
}

export async function showPDGViewForArgs(pdgArgs) {
  let { applicationUuid, applicationId } = pdgArgs;
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
  let failureReason = dp.pdgs.getCreatePDGFailureReason(pdgArgs);
  const warning = dp.pdgs.getWarning(pdgArgs);

  // // TODO
  // failureReason ||= warning;

  if (warning) {
    showWarningMessage(`PDG WARNING: ${warning}`);
  }

  let initialState;
  let hostOnlyState;
  let pdg;
  if (failureReason) {
    initialState = makeFailureState(failureReason);
    hostOnlyState = {};
  }
  else {
    pdg = dp.pdgs.getOrCreatePDG(pdgArgs);
    initialState = makeGraphState(pdg);
    hostOnlyState = { pdg };
  }

  // this worked! Hooray! → update memento (and hope that app is already exported)
  const testFilePath = app.getApplicationDataPath();
  testFilePath && await setTestPDGArgs({ testFilePath, ...pdgArgs, applicationUuid });

  return await showPDGView(pdg, initialState, hostOnlyState);
}

/**
 * @param {ProgramDependencyGraph} pdg 
 */
function makeGraphState(pdg) {
  // reset status message
  const failureReason = null;
  const { applicationId } = pdg.dp.application;

  return { failureReason, applicationId, ...pdg.getRenderData() };
}

function makeFailureState(failureReason) {
  return { failureReason, timelineNodes: null, edges: null };
}

/**
 * @param {ProgramDependencyGraph} pdg 
 */
async function showPDGView(pdg, pdgDocumentInitialState, hostOnlyState) {
  // TODO: we currently don't close window if PDG is gone from set, but this way, it will be out of sync with PDGs treeview

  // future-work: select correct window, based on initial state
  let handleWebviewStarted = null;
  const viewStartedPromise = new Promise((resolve) => handleWebviewStarted = resolve);
  const pDGWebView = new PDGWebView(pdg, pdgDocumentInitialState, hostOnlyState, handleWebviewStarted);
  await pDGWebView.init();
  await pDGWebView.show();
  // pathways-todo: add new action type
  // emitCallGraphAction(UserActionType.CallGraphVisibilityChanged, { isShowing: true });
  activeWebviews.set(pdg, pDGWebView);
  pDGWebView.onDispose(() => {
    pdg.pdgSet.remove(pdg);
  });
  // pdg.pdgSet.onSetChanged(() => {
  //   if (!pdg.pdgSet.contains(pdg)) {
  //     // pdg got removed → clean up?
  //   }
  // });
  await viewStartedPromise;
  return pDGWebView;
}

/** ###########################################################################
 * public control functions
 * future-work: make this non-global?
 * ##########################################################################*/

export function getActivePDGWebview() {
  return Array.from(activeWebviews.values()).find(w => w.isVisible);
}


export function disposePDGWebviews() {
  Array.from(activeWebviews.values()).forEach(w => w.dispose());
  activeWebviews = new Map();
}
