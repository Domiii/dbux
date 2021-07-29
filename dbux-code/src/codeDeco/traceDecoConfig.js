import { window } from 'vscode';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import ValueTypeCategory from '@dbux/common/src/types/constants/ValueTypeCategory';
import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('TraceDecoConfig');

// TODO: use proper theming

const lightred = 'rgba(1, 0, 0, 0.5)';

const StylingsByDecoName = {
  PushImmediate: {
    styling: {
      after: {
        // see: https://coolsymbol.com
        contentText: '↳',
        color: 'red',
      }
    }
  },
  PopImmediate: {
    styling: {
      before: {
        contentText: '⤴',
        color: 'red',
      }
    }
  },

  Function: {
    styling: {
      after: {
        contentText: 'ƒ',
        color: 'orange',
      }
    }
  },

  PushCallback: {
    styling: {
      after: {
        contentText: '↴',
        color: 'red',
      }
    }
  },
  PopCallback: {
    styling: {
      after: {
        contentText: '↱',
        color: 'red',
      }
    }
  },

  Await: {
    styling: {
      after: {
        // see https://www.alt-codes.net/hourglass-symbols
        contentText: '⧖',
        color: 'orange',
      }
    }
  },
  Resume: {
    styling: {
      after: {
        contentText: '↱',
        color: 'red',
      }
    }
  },

  BeforeExpression: {
    styling: {
      before: {
        contentText: '✧',
        color: 'gray',
      },
    }
  },

  ExpressionResult: {
    styling: {
      after: {
        contentText: '✦',
        color: 'red',
      },
    }
  },
  ReturnArgument: {
    styling: {
      after: {
        contentText: '✦',
        color: 'red',
      },
    }
  },
  ReturnNoArgument: {
    styling: {
      after: {
        contentText: '✦',
        color: 'gray',
      },
    }
  },

  Statement: {
    styling: {
      after: {
        contentText: '✧',
        color: 'lightred',
      },
    }
  },
  BlockStart: {
    styling: {
      after: {
        contentText: '↳',
        color: 'orange',
      }
    }
  },
  BlockEnd: {
    styling: {
      before: {
        contentText: '⤴',
        color: 'orange',
      }
    }
  },

  // ########################################
  // CallExpression decos
  // ########################################
  CallExpressionStep: {
    styling: {
      after: {
        contentText: '↱',
        color: 'red',
      },
    }
  },
  CallExpressionNoStep: {
    styling: {
      after: {
        contentText: '↱',
        color: 'gray',
      },
    }
  },

  /**
   * We use this for setters/getters/any recorded call without callId.
   */
  OtherCall: {
    styling: {
      after: {
        contentText: '↓',
        color: 'red',
      }
    }
  },

  // ########################################
  // Errors + Error handling
  // ########################################

  ThrowArgument: {
    styling: {
      after: {
        contentText: '🌋',
        color: 'yellow'
      }
    }
  },

  Error: {
    styling: {
      after: {
        contentText: '🔥',
        color: 'yellow'
      }
    }
  },

  // ########################################
  // don't display
  // ########################################
  BeforeCallExpression: false, //{
  //   styling: {
  //     after: {
  //       contentText: 'B',
  //       color: 'red'
  //     }
  //   }
  // },
  ExpressionValue: false,
  Callee: false,
  EndOfContext: false,
  Declaration: false,
  Literal: false,
  Identifier: false,
  WriteVar: false,
  DeclareAndWriteVar: false,
  WriteME: false,
  ClassInstance: false,
};

const decoNamesByType = {
  CallExpressionResult(dataProvider, staticTrace, trace) {
    // const valueRef = dataProvider.util.getTraceValueRef(trace.traceId);
    // if (valueRef?.category === ValueTypeCategory.Function) {
    //   return 'Function';
    // }

    const previousTrace = dataProvider.collections.traces.getById(trace.traceId - 1);
    if (previousTrace?.contextId > trace.contextId) {
      // call expression of an instrumented/traced function
      return 'CallExpressionStep';
    }
    // unknown function call
    return 'CallExpressionNoStep';
  },
  ExpressionResult(dp, staticTrace, trace) {
    const { traceId } = trace;
    if (dp.util.isTraceFunctionValue(traceId)) {
      return 'Function';
    }

    return 'ExpressionResult';
  },
  // CallArgument(dp, staticTrace, trace) {
  //   const { traceId } = trace;
  //   if (dp.util.isTraceFunctionValue(traceId)) {
  //     return 'Function';
  //   }

  //   return false;
  // },
  Param(dp, staticTrace, trace) {
    const { traceId } = trace;
    if (dp.util.isTraceFunctionValue(traceId)) {
      return 'Function';
    }

    return 'ExpressionResult';
  },
  CatchParam(/*dp, staticTrace, trace*/) {
    return 'ExpressionResult';
  },
  UpdateExpression() {
    return 'ExpressionResult';
  },
  ME() {
    return 'ExpressionResult';
  },
  FunctionDeclaration() {
    return 'Function';
  },
  FunctionDefinition() {
    return 'Function';
  },
  ClassDeclaration() {
    return 'ExpressionResult';
  },
  ClassDefinition() {
    return 'ExpressionResult';
  },
  ClassProperty() {
    return 'ExpressionResult';
  },
};


let configsByName, decoNames;

// ###########################################################################
// init
// ###########################################################################


function initConfig(decoConfig) {
  configsByName = {};
  for (const decoName in decoConfig) {
    const cfg = decoConfig[decoName];
    if (cfg) {
      // const type = TraceType.valueFromForce(typeName);
      cfg.editorDecorationType = window.createTextEditorDecorationType(cfg.styling);
    }
    configsByName[decoName] = cfg;
  }
  decoNames = Object.keys(configsByName);
}

export function initTraceDecorators() {
  initConfig(StylingsByDecoName);
  configSanityCheck();
}

export function getTraceDecoName(dataProvider, staticTrace, trace) {
  const { traceId, error, callId } = trace;

  // special decorations
  if (error) {
    return 'Error';
  }

  // handle getters + setters (not by type)
  if (!callId) {
    const calledContext = dataProvider.indexes.executionContexts.byCalleeTrace.get(traceId);
    if (calledContext) {
      return 'OtherCall';
    }
  }

  // default: check by type name
  const traceType = dataProvider.util.getTraceType(traceId);
  const typeName = TraceType.nameFrom(traceType);

  const f = decoNamesByType[typeName];
  if (f) {
    const name = f(dataProvider, staticTrace, trace);
    if (name) {
      return name;
    }
  }
  return typeName;
}

export function getDecoConfigByName(decoName) {
  return configsByName[decoName];
}

export function getAllTraceDecoNames() {
  return decoNames;
}

function configSanityCheck() {
  const missingTypes = [];
  for (const traceTypeName of TraceType.names) {
    if (traceTypeName in decoNamesByType) {
      continue;
    }

    const config = getDecoConfigByName(traceTypeName);
    if (config || config === false) {
      continue;
    }

    missingTypes.push(traceTypeName);
  }

  if (missingTypes.length) {
    warn(`Missing decoration config for trace types: ${missingTypes.join(', ')}`);
  }
}
