import { window } from 'vscode';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import { newLogger, logInternalError } from 'dbux-common/src/log/logger';
import allApplications from 'dbux-data/src/applications/allApplications';
import { pushArrayOfArray, EmptyArray } from 'dbux-common/src/util/arrayUtil';
import TraceDecoratorConfig, { getDecoName } from './traceDecoConfig';
import { babelLocToCodeRange } from '../helpers/locHelpers';

const { log, debug, warn, error: logError } = newLogger('traceDecorator');


// ###########################################################################
// render
// ###########################################################################

function groupTracesByDecoName(staticTraces, allDecosByName) {
  const groupsByType = dataProvider.util.groupTracesByType(staticTraces);

  const groupsByDecoName = {};
  for (const type in groupsByType) {
    const group = groupsByType[type];
    if (!group) {
      continue;
    }

    const [staticTrace, traces] = group;
    for (const trace of traces) {
      const groupName = getDecoName(trace);
    }
  }

  for (let traceType = 1; traceType < traceGroupsByType.length; ++traceType) {
    // add all decorations for group
    const groups = traceGroupsByType[traceType];
    if (groups) {
      for (const group of groups) {
        const [staticTrace, traces] = group;
        const decoration = createTraceGroupDecoration(dataProvider, traceType, staticTrace, traces);
        pushArrayOfArray(allDecosByName, decoName, decoration);
      }
    }
  }
}

/**
 * TODO: the order of decorations is currently dictacted by the order of their decoration types (VSCode limitation)
 */
export function renderTraceDecorations(editor, fpath) {
  const allDecosByName = [];

  // prepare decorations
  allApplications.selection.data.mapApplicationsOfFilePath(fpath, (application, programId) => {
    const { dataProvider } = application;
    const staticTraces = dataProvider.indexes.staticTraces.visitedByFile.get(programId);
    // const traces = dataProvider.indexes.traces.byFile.get(programId);
    if (!staticTraces) {
      // debug(`No traces in file "${fpath}" for application with entry point ${application.entryPointPath}`);
      return;
    }

    // group by TraceType

    // group by decoName
    const traceGroupsByDecoName = groupTracesByDecoName(staticTraces, allDecosByName);

    // TODO: 
  });

  // render decorations
  for (let traceType = 1; traceType < configsByType.length; ++traceType) {
    // TextEditorDecorationType
    // see: https://code.visualstudio.com/api/references/vscode-api#TextEditorDecorationType
    const config = configsByType[traceType];
    const decorations = allDecosByName[traceType];

    if (!config?.editorDecorationType) {
      if (decorations) {
        logError('found TraceType in trace that is not configured', traceType, TraceType.nameFrom(traceType));
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

function createTraceGroupDecoration(dataProvider, traceType, staticTrace, traces) {
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