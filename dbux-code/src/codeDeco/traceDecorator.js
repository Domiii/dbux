import { window } from 'vscode';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import { newLogger, logInternalError } from 'dbux-common/src/log/logger';
import allApplications from 'dbux-data/src/applications/allApplications';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import groupBy from 'lodash/groupBy';
import { getTraceDecoName, getDecoConfigByName, getAllTraceDecoNames } from './traceDecoConfig';
import { babelLocToCodeRange } from '../helpers/codeLocHelpers';

const { log, debug, warn, error: logError } = newLogger('traceDecorator');


// ###########################################################################
// render
// ###########################################################################

/**
 * Groups traces by decoName, as well as staticTraceId.
 * 
 * TODO: improve performance to work in long loops
 */
function groupTracesByDecoNameAndStaticTrace(application,
  staticTraces: StaticTrace[], allDecosByName) {
  const { dataProvider } = application;
  for (const staticTrace of staticTraces) {
    const {
      staticTraceId
    } = staticTrace;

    const traces = dataProvider.indexes.traces.byStaticTrace.get(staticTraceId);
    if (!traces) {
      continue;
    }

    // group by decoName
    const byDecoName = groupBy(traces, trace => getTraceDecoName(dataProvider, staticTrace, trace));

    // put all groups together
    for (const decoName in byDecoName) {
      const tracesOfDecoName = byDecoName[decoName];
      const bag = allDecosByName[decoName] || (allDecosByName[decoName] = []);
      // bag.push([staticTrace, tracesOfDecoName]);
      const decoration = createTraceGroupDecoration(dataProvider, 
        decoName, staticTrace, tracesOfDecoName);
      bag.push(decoration);
    }
  }
}

/**
 * TODO: the order of decorations is currently dictacted by the order of their decoration types (VSCode limitation)
 */
export function renderTraceDecorations(editor, fpath) {
  // create empty deco set (to make sure, it will reset/remove decos after use)
  const decosByName = Object.fromEntries(getAllTraceDecoNames().map(name => [name, []]));

  // prepare decorations
  allApplications.selection.data.mapApplicationsOfFilePath(fpath, (application, programId) => {
    const { dataProvider } = application;
    const staticTraces = dataProvider.indexes.staticTraces.visitedByFile.get(programId);
    // const traces = dataProvider.indexes.traces.byFile.get(programId);
    if (!staticTraces) {
      // debug(`No traces in file "${fpath}" for application with entry point ${application.entryPointPath}`);
      return;
    }

    // group by decoName
    // const decoGroupsByName = {};
    groupTracesByDecoNameAndStaticTrace(application, staticTraces, decosByName);
  });

  // render decorations
  for (const decoName in decosByName) {
    // TextEditorDecorationType
    // see: https://code.visualstudio.com/api/references/vscode-api#TextEditorDecorationType
    const decorations = decosByName[decoName];
    const config = getDecoConfigByName(decoName);

    if (!config?.editorDecorationType) {
      if (decorations && config !== false) {
        logError('found decoName for trace that is not configured (suggestion: set to `false` to avoid displaying it)', decoName);
      }
      continue;
    }

    if (decorations) {
      editor.setDecorations(config.editorDecorationType, decorations);
    }
    else {
      // removes previous decorations of given DecorationType
      editor.setDecorations(config.editorDecorationType, EmptyArray);
    }
  }
}

function createTraceGroupDecoration(dataProvider, decoName, staticTrace, traces) {
  const {
    staticTraceId,
    loc
  } = staticTrace;

  // let { displayName } = staticTrace;

  // // values
  // let valueString;
  // const hasValue = dataProvider.util.doesStaticTraceHaveValue(staticTraceId);
  // if (hasValue) {
  //   // TODO: check individual traces for values instead, as *Callback trace types often come from a `CallArgument` trace
  //   const values = traces.map(trace => dataProvider.util.getTraceValue(trace.traceId));
  //   valueString = `\n* ${values.map(v => v === undefined ? 'undefined' : v).join('\n* ')}\n\n`;
  // }
  // else {
  //   valueString = ' ';
  // }

  // // traceType
  // let typeString = ` [${TraceType.nameFromForce(traceType)}]`;

  // // displayName
  // if (!displayName) {
  //   displayName = typeString;
  //   typeString = '';
  // }

  // // status + repitition count
  // const statusString = traces.length > 1 ? ` x${traces.length}` : '';

  // return decoration object required by vscode API
  // see https://code.visualstudio.com/api/references/vscode-api#DecorationOptions
  return {
    range: babelLocToCodeRange(loc)
  };
}