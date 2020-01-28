import {
  Disposable,
  workspace,
  window,
  OverviewRulerLane,
  DecorationOptions,
  Range,
  TextEditor
} from 'vscode';

import { makeDebounce } from 'dbux-common/src/util/scheduling';
import { newLogger } from 'dbux-common/src/log/logger';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import applicationCollection from 'dbux-data/src/applicationCollection';
import { getCodeRangeFromLoc } from '../util/codeUtil';
// import DataProvider from 'dbux-data/src/DataProvider';
// import StaticContextType from 'dbux-common/src/core/constants/StaticContextType';

const { log, debug, warn, error: logError } = newLogger('code-deco');

let activeEditor: TextEditor;
let TraceDecorationType;
let unsubscribeFromSelectedApplication;

// ###########################################################################
// trace filters
// ###########################################################################

// const filters = {
//   noProgram(dp : DataProvider, trace) {
//     const contextType = dp.util.getTraceContextType(trace.traceId);
//     return contextType !== StaticContextType.Program;
//   }
// };

// const defaultFilter = filters.noProgram;

// ###########################################################################
// render
// ###########################################################################

const renderDecorations = makeDebounce(function renderDecorations() {
  if (!activeEditor) {
    return;
  }

  const fpath = activeEditor.document.uri.fsPath;
  const dataProvider = applicationCollection.getSelectedApplication()?.dataProvider;
  if (!dataProvider) {
    return;
  }

  const programId = dataProvider.queries.programIdByFilePath(fpath);
  if (!programId) {
    debug('Program not executed', fpath);
    return;
  }
  const traces = dataProvider.indexes.traces.byFile.get(programId);
  if (!traces) {
    debug('No traces in file', fpath);
    return;
  }

  const decorations = [];

  for (const trace of traces) {
    const {
      staticTraceId,
      traceId,
      type: dynamicType
    } = trace;
    const staticTrace = dataProvider.collections.staticTraces.getById(staticTraceId);
    let {
      displayName,
      loc,
      type: staticType
    } = staticTrace;

    const value = dataProvider.util.getTraceValue(traceId);

    // const context = dataProvider.collections.executionContexts.getById(contextId);
    // const childContexts = dataProvider.indexes.executionContexts.children.get(contextId);

    if (!displayName) {
      const type = dynamicType || staticType; // if `dynamicType` is given take that, else `staticType`
      const typeName = TraceType.nameFromForce(type);
      displayName = `[${typeName}]`;
    }

    const decoration = {
      range: getCodeRangeFromLoc(loc),
      hoverMessage: `Trace **${displayName}** (${value})`
    };
    decorations.push(decoration);
  }

  activeEditor.setDecorations(TraceDecorationType, decorations);
});


// ###########################################################################
// DecorationTypes
// ###########################################################################

function buildDecorationTypes() {
  // create a decorator type that we use to decorate small numbers
  TraceDecorationType = window.createTextEditorDecorationType({
    after: {
      // see: https://coolsymbol.com/circle-symbols.html
      contentText: '◉',
      
      color: 'red',
      // light: {
      //   color: 'darkred'
      // },
      // dark: {
      //   color: 'lightred'
      // }
    },
    cursor: 'crosshair',
    borderWidth: '1px',
    borderStyle: 'solid',
    overviewRulerColor: 'blue',
    overviewRulerLane: OverviewRulerLane.Right,
    // light: {
    //   // this color will be used in light color themes
    //   borderColor: 'darkblue'
    // },
    // dark: {
    //   // this color will be used in dark color themes
    //   borderColor: 'lightblue'
    // }
  });
}


// ###########################################################################
// init
// ###########################################################################

/**
 * Relevant VSCode API (https://code.visualstudio.com/api/references/vscode-api):
 *  DecorationRenderOptions
 *  DocumentHighlight
 *  DocumentLinkProvider
 *  DocumentRangeFormattingEditProvider
 * 
 */
export function initCodeDeco(context) {
  buildDecorationTypes();
  activeEditor = window.activeTextEditor;

  const selectedApplication = applicationCollection.getSelectedApplication();
  if (selectedApplication && activeEditor) {
    // initial render
    renderDecorations();
  }

  // ########################################
  // register event listeners
  // ########################################

  // data changed
  applicationCollection.onSelectionChanged((app) => {
    unsubscribeFromSelectedApplication && unsubscribeFromSelectedApplication();
    if (app) {
      unsubscribeFromSelectedApplication = app.dataProvider.onData('traces', renderDecorations);
    }
  });

  // active window changed
  window.onDidChangeActiveTextEditor(editor => {
    activeEditor = editor;
    if (editor) {
      renderDecorations();
    }
  }, null, context.subscriptions);

  // text content changed?
  // workspace.onDidChangeTextDocument(event => {
  //   if (activeEditor && event.document === activeEditor.document) {
  //     renderDecorations();
  //   }
  // }, null, context.subscriptions);
}
