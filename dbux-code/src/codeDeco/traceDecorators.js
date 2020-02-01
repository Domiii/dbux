import { window } from 'vscode';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import { newLogger, logInternalError } from 'dbux-common/src/log/logger';
import DefaultTraceDecoratorConfig from './DefaultTraceDecoratorConfig';
import { getCodeRangeFromLoc } from '../util/codeUtil';

const { log, debug, warn, error: logError } = newLogger('deco-trace');
let configsByType;

// ###########################################################################
// render
// ###########################################################################

export function renderTraceDecorations(dataProvider, editor, programId, fpath) {
  const staticTraces = dataProvider.indexes.staticTraces.visitedByFile.get(programId);
  // const traces = dataProvider.indexes.traces.byFile.get(programId);
  if (!staticTraces) {
    debug('No traces in file', fpath);
    return;
  }

  const traceGroupsByType = dataProvider.util.groupTracesByType(staticTraces);

  for (let type = 1; type < configsByType.length; ++type) {
    // TextEditorDecorationType
    // see: https://code.visualstudio.com/api/references/vscode-api#TextEditorDecorationType
    const config = configsByType[type];

    // produce decorations
    const decorations = [];
    const groups = traceGroupsByType[type];
    if (groups) {
      if (!config?.editorDecorationtype) {
        logError('found TraceType in trace that is not configured', type);
        continue;
      }

      for (const group of groups) {
        const [staticTrace, traces] = group;
        const decoration = renderTraceGroup(dataProvider, type, staticTrace, traces);
        decorations.push(decoration);
      }
    }
    else if (!config?.editorDecorationtype) {
      continue;
    }

    // setDecorations
    editor.setDecorations(config.editorDecorationtype, decorations);
  }
}

function renderTraceGroup(dataProvider, traceType, staticTrace, traces) {
  const {
    staticTraceId,
    loc
  } = staticTrace;

  let { displayName } = staticTrace;

  // values
  let valueString;
  const hasValue = dataProvider.util.doesStaticTraceHaveValue(staticTraceId);
  if (hasValue) {
    const values = traces.map(trace => dataProvider.util.getTraceValue(trace.traceId));
    valueString = `\n* ${values.map(v => v === undefined ? 'undefined' : v).join('\n* ')}\n\n`;
  }
  else {
    valueString = '';
  }

  // traceType
  let typeString = ` [${TraceType.nameFromForce(traceType)}]`;

  // displayName
  if (!displayName) {
    displayName = typeString;
    typeString = '';
  }

  // return decoration object required by vscode API
  // see https://code.visualstudio.com/api/references/vscode-api#DecorationOptions
  return {
    range: getCodeRangeFromLoc(loc),
    hoverMessage: `**${displayName}**${typeString} ${valueString}`
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
    config.editorDecorationtype = window.createTextEditorDecorationType(config.styling);
    configsByType[type] = config;
  }
}

export function initTraceDecorators() {
  initConfig(DefaultTraceDecoratorConfig);
}