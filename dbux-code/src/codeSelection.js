import { window } from 'vscode';
import traceSelection from 'dbux-data/src/traceSelection';
import allApplications from 'dbux-data/src/applications/allApplications';
import { goToTrace, getCursorLocation, getOrOpenTraceEditor } from './codeNav';
import codeDecorations, { CodeDecoRegistration } from './codeDeco/codeDecorations';
import { babelLocToCodeRange } from './helpers/locHelper';


// ###########################################################################
// selected trace deco
// ###########################################################################

// TODO: clean up `selectedTrace*` stuff and integrate with playback feature

const selectedTraceDecoType = {
  border: '1px solid blue'
};
let selectedTraceRegistration: CodeDecoRegistration;

async function highlightTraceInEditor(trace) {
  let deco;
  if (!trace) {
    // deselect trace
    deco = null;
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
  }
  
  const editor = await getOrOpenTraceEditor(trace);
  selectedTraceRegistration.setDeco(editor, deco);
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
function handleCursorChanged(evt) {
  const where = getCursorLocation();
  // TODO: if already selected a trace, find closest traces to that at `where`
}

// ###########################################################################
// init
// ###########################################################################

export function initTraceSelection(context) {
  // show + goto trace if selected
  traceSelection.onTraceSelectionChanged((selectedTrace) => {
    selectedTrace && goToTrace(selectedTrace);
    highlightTraceInEditor(selectedTrace);
  });

  // select trace when moving cursor in TextEditor
  context.subscriptions.push(
    window.onDidChangeTextEditorSelection(handleCursorChanged)
  );
}
