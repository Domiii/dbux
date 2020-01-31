import {
  Disposable,
  workspace,
  window,
  OverviewRulerLane,
  DecorationOptions,
  Range,
  TextEditor
} from 'vscode';

import countBy from 'lodash/countBy';
import sortBy from 'lodash/sortBy';
import map from 'lodash/map';

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

  const staticTraces = dataProvider.indexes.staticTraces.visitedByFile.get(programId);
  // const traces = dataProvider.indexes.traces.byFile.get(programId);
  if (!staticTraces) {
    debug('No traces in file', fpath);
    return;
  }

  const decorations = [];

  for (const staticTrace of staticTraces) {
    const decoration = renderStaticTraceDecoration(staticTrace);
    decorations.push(decoration);
  }

  activeEditor.setDecorations(TraceDecorationType, decorations);
});


/**
 * Get counts of array of numbers, then sort it.
 * @returns {{ type, count }[]}
 */
function countAndSort(a) {
  const counts = map(
    countBy(a),
    (count, type) => ({ type, count }) // map single object to array of small objects
  );

  return sortBy(counts, o => -o.count);
}

function renderStaticTraceDecoration(staticTrace) {
  const dataProvider = applicationCollection.getSelectedApplication().dataProvider;
  const {
    staticTraceId,
    loc,
    type: staticType
  } = staticTrace;

  let { displayName } = staticTrace;

  // const context = dataProvider.collections.executionContexts.getById(contextId);
  // const childContexts = dataProvider.indexes.executionContexts.children.get(contextId);

  const traces = dataProvider.indexes.traces.byStaticTrace.get(staticTraceId);
  const values = [];
  const types = [];
  for (const trace of traces) {
    const {
      traceId,
      type: dynamicType
    } = trace;

    const value = dataProvider.util.getTraceValue(traceId);
    value !== undefined && values.push(value);
    types.push(dynamicType || staticType); // if `dynamicType` is not given its `staticType`
  }

  const valueString = values.length && `\n ${values.join('\n ')}\n` || '';
  const countedTypes = countAndSort(types);
  const typeStrings = countedTypes.map(({ type, count }) => 
    `${TraceType.nameFromForce(type)}${count > 1 && ` x${count}` || ''}`
  );

  let typeString = `[${typeStrings.join(', ')}]`;

  if (!displayName) {
    displayName = typeString;
    typeString = '';
  }

  return {
    range: getCodeRangeFromLoc(loc),
    hoverMessage: `**${displayName}** ${valueString}${typeString}`
  };
}


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
      unsubscribeFromSelectedApplication = app.dataProvider.onData({
        collections: {
          traces: renderDecorations,
          staticTraces: renderDecorations
        }
      });
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
