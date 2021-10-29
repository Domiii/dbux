import { window } from 'vscode';
import traceSelection from '@dbux/data/src/traceSelection';
import allApplications from '@dbux/data/src/applications/allApplications';
import { goToTrace, getCursorLocation, getOrOpenTraceEditor, getTraceDocumentUri } from './codeNav';
import codeDecorations, { CodeDecoRegistration } from '../codeDeco/codeDecorations';
import { babelLocToCodeRange } from '../helpers/codeLocHelpers';

// ###########################################################################
// selected trace deco
// ###########################################################################

// TODO: clean up `selectedTrace*` stuff and integrate with playback feature

/**
 * @see https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions
 */
const selectedTraceDecoType = {
  border: '1px solid red'
};

/**
 * @type {CodeDecoRegistration}
 */
let selectedTraceRegistration;

async function highlightTraceInEditor(trace) {
  let deco;
  if (!trace) {
    // deselect trace
    deco = null;
    selectedTraceRegistration.unsetDeco();
  }
  else {
    // select new trace
    const dp = allApplications.getApplication(trace.applicationId).dataProvider;
    const { staticTraceId } = dp.collections.traces.getById(trace.traceId);
    const { loc } = dp.collections.staticTraces.getById(staticTraceId);
    if (!selectedTraceRegistration) {
      selectedTraceRegistration = codeDecorations.registerDeco(selectedTraceDecoType);
    }
    deco = {
      range: babelLocToCodeRange(loc)
    };

    const editor = await getOrOpenTraceEditor(trace);
    selectedTraceRegistration.setDeco(editor, deco);
  }
}

// ###########################################################################
// utilities
// ###########################################################################

// no utilities yet

// ###########################################################################
// event handlers
// ###########################################################################

/**
 * @param {TextEditorSelectionChangeEvent} evt
 */
function handleCursorChanged() {
  // const where = getCursorLocation();
  // TODO: if already selected a trace, find closest traces to that at `where`
}

// ###########################################################################
// init
// ###########################################################################

export function initTraceSelection(context) {
  // show + goto trace if selected
  traceSelection.onTraceSelectionChanged((selectedTrace, sender) => {
    highlightTraceInEditor(selectedTrace);
    // do not nav if user is using 'selectTraceAtCursor'
    if (sender === 'selectTraceAtCursor') return;
    selectedTrace && goToTrace(selectedTrace);
  });


  // active window changed
  window.onDidChangeActiveTextEditor(editor => {
    const trace = traceSelection.selected;
    if (trace && editor && editor.document.uri.fsPath === getTraceDocumentUri(trace).fsPath) {
      highlightTraceInEditor(trace);
    }
  }, null, context.subscriptions);

  // select trace when moving cursor in TextEditor
  // context.subscriptions.push(
  //   window.onDidChangeTextEditorSelection(handleCursorChanged)
  // );
}
