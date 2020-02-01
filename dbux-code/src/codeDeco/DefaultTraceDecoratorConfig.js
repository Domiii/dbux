
// TODO: use proper theming

const lightred = 'rgba(1, 0, 0, 0.5)';

const DefaultTraceDecoratorConfig = {
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

  ScheduleCallback: {
    styling: {
      before: {
        // see https://www.alt-codes.net/hourglass-symbols
        contentText: '⧖',
        color: 'red',
      }
    }
  },

  PushCallback: {
    styling: {
      after: {
        contentText: '↳',
        color: 'red',
      }
    }
  },
  PopCallback: {
    styling: {
      before: {
        contentText: '⤴',
        color: 'red',
      }
    }
  },

  Await: {
    styling: {
      before: {
        contentText: '⧖',
        color: 'red',
      }
    }
  },
  Resume: {
    styling: {
      after: {
        contentText: '↳',
        color: 'red',
      }
    }
  },

  BeforeExpression: {
    styling: {
      after: {
        contentText: '✧',
        color: 'lightred',
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
        color: 'lightred',
      }
    }
  },
  BlockEnd: {
    styling: {
      before: {
        contentText: '⤴',
        color: 'lightred',
      }
    }
  }
};

export default DefaultTraceDecoratorConfig;