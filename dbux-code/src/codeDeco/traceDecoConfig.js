import { window } from 'vscode';
import TraceType from 'dbux-common/src/core/constants/TraceType';

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
        color: 'gray',
      }
    }
  },
  BlockEnd: {
    styling: {
      before: {
        contentText: '⤴',
        color: 'gray',
      }
    }
  },

  // ########################################
  // CallExpression decos
  // ########################################
  CallExpressionStep: {
    styling: {
      after: {
        contentText: '⤴',
        color: 'red',
      },
    }
  },
  CallExpressionNoStep: {
    styling: {
      after: {
        contentText: '⤴',
        color: 'gray',
      },
    }
  }
};

const decoNamesByType = {
  CallExpression(dataProvider, staticTrace, trace) {
    const previousTrace = dataProvider.collections.traces.getById(trace.traceId - 1);
    if (previousTrace.contextId > trace.contextId) {
      return 'CallExpressionStep';
    }
    return 'CallExpressionNoStep';
  }
};

let configsByName;

// ###########################################################################
// init
// ###########################################################################


function initConfig(decoConfig) {
  configsByName = {};
  for (const decoName in decoConfig) {
    const cfg = decoConfig[decoName];
    if (!cfg) {
      continue;
    }
    // const type = TraceType.valueFromForce(typeName);
    cfg.editorDecorationType = window.createTextEditorDecorationType(cfg.styling);
    configsByName[decoName] = cfg;
  }
}

export function initTraceDecorators() {
  initConfig(StylingsByName);
}

export function getTraceDecoName(dataProvider, staticTrace, trace) {
  const traceType = dataProvider.util.getTraceType(trace);
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