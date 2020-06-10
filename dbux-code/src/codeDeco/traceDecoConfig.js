import { window } from 'vscode';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import ValueTypeCategory from 'dbux-common/src/core/constants/ValueTypeCategory';

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
  CalleeObject: false,
  ExpressionValue: false,
  CallArgument: false,
  Callee: false,
  EndOfContext: false
};

const decoNamesByType = {
  CallExpressionResult(dataProvider, staticTrace, trace) {
    const valueRef = dataProvider.util.getTraceValueRef(trace.traceId);
    if (valueRef?.category === ValueTypeCategory.Function) {
      return 'CallbackArgument';
    }

    const previousTrace = dataProvider.collections.traces.getById(trace.traceId - 1);
    if (previousTrace.contextId > trace.contextId) {
      // call expression of a function that we also instrumented (stepped into)
      return 'CallExpressionStep';
    }
    // unknown function call
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
  const { traceId, error } = trace;

  // special decorations
  if (error) {
    return 'Error';
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