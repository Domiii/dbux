import { window } from 'vscode';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import { newLogger, logInternalError } from 'dbux-common/src/log/logger';
import DefaultTraceDecoratorConfig from './DefaultTraceDecoratorConfig';
import { babelLocToCodeRange } from '../helpers/locHelper';
import allApplications from 'dbux-data/src/applications/allApplications';
import { pushArrayOfArray, EmptyArray } from 'dbux-common/src/util/arrayUtil';

const { log, debug, warn, error: logError } = newLogger('traceDecorator');

let configsByType;

// ###########################################################################
// render
// ###########################################################################

/**
 * TODO: the order of decorations is currently dictacted by the order of their decoration types (VSCode limitation)
 */
export function renderTraceDecorations(editor, fpath) {
  const allDecorations = [];

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
    const traceGroupsByType = dataProvider.util.groupTracesByType(staticTraces);

    for (let traceType = 1; traceType < traceGroupsByType.length; ++traceType) {
      // add all decorations for group
      const groups = traceGroupsByType[traceType];
      if (groups) {
        for (const group of groups) {
          const [staticTrace, traces] = group;
          const decoration = createTraceGroupDecoration(dataProvider, traceType, staticTrace, traces);
          pushArrayOfArray(allDecorations, traceType, decoration);
        }
      }
    }
  });

  // render decorations
  for (let traceType = 1; traceType < configsByType.length; ++traceType) {
    // TextEditorDecorationType
    // see: https://code.visualstudio.com/api/references/vscode-api#TextEditorDecorationType
    const config = configsByType[traceType];
    const decorations = allDecorations[traceType];

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

// ###########################################################################
// init
// ###########################################################################


function initConfig(allConfigs) {
  configsByType = [];
  for (const typeName in allConfigs) {
    const config = allConfigs[typeName];
    if (!config) {
      continue;
    }
    const type = TraceType.valueFromForce(typeName);
    config.editorDecorationType = window.createTextEditorDecorationType(config.styling);
    configsByType[type] = config;
  }
}

export function initTraceDecorators() {
  initConfig(DefaultTraceDecoratorConfig);
}