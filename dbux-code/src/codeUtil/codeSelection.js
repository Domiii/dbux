import { window } from 'vscode';
import traceSelection from 'dbux-data/src/traceSelection';
import allApplications from 'dbux-data/src/applications/allApplications';
import { goToTrace, getCursorLocation, getOrOpenTraceEditor } from './codeNav';
import codeDecorations, { CodeDecoRegistration } from '../codeDeco/codeDecorations';
import { babelLocToCodeRange } from '../helpers/codeLocHelpers';


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
function handleCursorChanged(evt) {
  const where = getCursorLocation();
  // TODO: if already selected a trace, find closest traces to that at `where`
}

// ###########################################################################
// init
// ###########################################################################

export function initTraceSelection(context) {
  // unselect trace if its not in a selected application anymore
  allApplications.selection.onApplicationsChanged((selectedApps) => {
    for (const app of selectedApps) {
      allApplications.selection.subscribe(
        app.dataProvider.onData('traces', () => {
          if (traceSelection.selected &&
            !allApplications.selection.containsApplication(traceSelection.selected.applicationId)) {
            // deselect
            traceSelection.selectTrace(null);
          }
        })
      );
    }
  });

  // show + goto trace if selected
  traceSelection.onTraceSelectionChanged((selectedTrace, sender) => {
    highlightTraceInEditor(selectedTrace);
    // only highlight but not nav if user is using 'selectTraceAtCursor'
    if (sender === 'selectTraceAtCursor') return;
    selectedTrace && goToTrace(selectedTrace);
  });

  // select trace when moving cursor in TextEditor
  // context.subscriptions.push(
  //   window.onDidChangeTextEditorSelection(handleCursorChanged)
  // );
}
