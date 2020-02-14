import { window } from 'vscode';
import TraceType from 'dbux-common/src/core/constants/TraceType';

// TODO: use proper theming

const lightred = 'rgba(1, 0, 0, 0.5)';

const TraceDecoratorConfig = {
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
  }
};


let configsByType;

// ###########################################################################
// init
// ###########################################################################


function initConfig(decoConfig) {
  configsByType = [];
  for (const typeName in decoConfig) {
    const cfg = decoConfig[typeName];
    if (!cfg) {
      continue;
    }
    const type = TraceType.valueFromForce(typeName);
    cfg.editorDecorationType = window.createTextEditorDecorationType(cfg.styling);
    configsByType[type] = cfg;
  }
}

export function initTraceDecorators() {
  initConfig(TraceDecoratorConfig);
}

export function getDecoName(trace) {

}

export function getAllConfigsByName() {
  
}