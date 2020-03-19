import { window } from 'vscode';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import ValueRefCategory from 'dbux-common/src/core/constants/ValueRefCategory';

// TODO: use proper theming

const lightred = 'rgba(1, 0, 0, 0.5)';

const StylingsByName = {
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

  CallbackArgument: {
    styling: {
      after: {
        // see https://www.alt-codes.net/hourglass-symbols
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

  BeforeCallExpression: false,    // don't display

  ExpressionResult: {
    styling: {
      after: {
        contentText: '✦',
        color: 'red',
      },
    }
  },
  Callee: false, // don't render at all
  CallArgument: {
    styling: {
      after: {
        contentText: '✦',
        color: 'red',
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

  // ########################################
  // Data-only
  // ########################################
  CalleeObject: false
};

const decoNamesByType = {
  CallExpressionResult(dataProvider, staticTrace, trace) {
    const valueRef = dataProvider.util.getTraceValueRef(trace.traceId);
    if (valueRef?.category === ValueRefCategory.Function) {
      return 'CallbackArgument';
    }
    
    const previousTrace = dataProvider.collections.traces.getById(trace.traceId - 1);
    if (previousTrace.contextId > trace.contextId) {
      return 'CallExpressionStep';
    }
    return 'CallExpressionNoStep';
  }
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
  initConfig(StylingsByName);
}

export function getTraceDecoName(dataProvider, staticTrace, trace) {
  const traceType = dataProvider.util.getTraceType(trace.traceId);
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