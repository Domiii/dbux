// TODO: want to do some extra work to better trace loops

const traceCfg = (() => {
  const captureValue = true;
  const dontTrace = true;
  const statement = true;
  const block = true;
  const statementCfg = {
    captureValue: false,
    statement
  };
  const blockCfg = {
    captureValue: false,
    statement,
    block
  };

  return {
    // assignments
    AssignmentExpression: {
      dontTrace,
      children: [['right', true]]
    },
    ClassPrivateProperty: {
      dontTrace,
      children: [['value', true]]
    },
    ClassProperty: {
      dontTrace,
      children: [['value', true]],
    },

    // expressions
    AwaitExpression: {
      captureValue,
      children: [['argument', false]]
    },
    ConditionalExpression: {
      captureValue,
      children: [['test', true], ['consequent', blockCfg], ['alternate', blockCfg]]
    },
    CallExpression: {
      captureValue,
      // children: [['arguments', true]] // TODO: must capture each individual argument
    },
    OptionalCallExpression: {
      captureValue,
      // children: [['arguments', true]] // TODO: must capture each individual argument
    },
    Super: false,
    UpdateExpression: true,
    YieldExpression: {
      dontTrace,
      children: [['argument', true]]
    },

    // variable declarations
    VariableDeclarator: {
      dontTrace,
      children: [['init', true]]
    },

    // statements
    BreakStatement: statementCfg,
    ContinueStatement: statementCfg,
    Decorator: {
      dontTrace,
      children: [['expression', false]]
    },
    Declaration: {
      captureValue: false,
      statement: true,
      ignore: ['ImportDeclaration'] // cannot mess with imports
    },
    ReturnStatement: statementCfg,
    ThrowStatement: statementCfg,

    // loops
    DoWhileLoop: {
      dontTrace,
      children: [['test', true], ['body', blockCfg]]
    },
    ForInStatement: {
      dontTrace,
      children: [['body', blockCfg]]
    },
    ForOfStatement: {
      dontTrace,
      children: [['body', blockCfg]]
    },
    ForStatement: {
      dontTrace,
      children: [['test', true], ['update', true], ['body', blockCfg]]
    },
    WhileStatement: {
      dontTrace,
      children: [['test', true], ['body', blockCfg]]
    },

    // if, else, switch
    IfStatement: {
      dontTrace,
      children: [['test', true], ['consequent', blockCfg], ['alternate', blockCfg]],
    },
    SwitchStatement: {
      dontTrace,
      children: [['discriminant', true]]
    },
    // SwitchCase: {
    // TODO: insert trace call into `consequent` array
    //   dontTrace,
    //   children: [['consequent']]
    // },

    // try + catch
    TryStatement: {
      dontTrace,
      children: [['block', blockCfg], ['finalizer', blockCfg]]
    },
    CatchClause: {
      dontTrace,
      children: [['body', blockCfg]]
    },

    // ExpressionStatement: [['expression', true]], // already taken care of by everything else

  };
})();

function err(message, obj) {
  throw new Error(message + ' - ' + JSON.stringify(obj));
}

function validateCfgNode(node) {
  if (node.captureValue && (node.statement || node.block)) {
    err('invalid config', node);
  }
}

function validateCfg(cfg) {
  for (const name in cfg) {
    const node = cfg[name];
    validateCfgNode(node);
    const children = node.children || {};
    for (const child of children) {
      validateCfgNode(child);
    }
  }
}

function normalizeConfig() {
  for (const visitorName in traceCfg) {
    let nodeCfg = traceCfg[visitorName];
    if (nodeCfg === true || nodeCfg === false) {
      // only captureValue (boolean)
      nodeCfg = {
        captureValue: nodeCfg,
        children: null,
        dontTrace: false
      };
    }
    else if (Array.isArray(nodeCfg)) {
      const children = nodeCfg;
      nodeCfg = {
        captureValue: false,
        children,
        dontTrace: false
      }
    }
    else if (typeof nodeCfg !== 'object') {
      throw new Error('invalid traceCfg: ' + visitorName + ' - ' + JSON.stringify(nodeCfg));
    }

    if (nodeCfg.children) {
      for (let i = 0; i < nodeCfg.children.length; ++i) {
        let child = nodeCfg.children[i];
        if (child.constructor === String) {
          child = {
            name: child,
            captureValue: false
          };
        }
        else if (Array.isArray(child)) {
          const [name, childCfgOrCaptureValue = false] = child;
          if (typeof childCfgOrCaptureValue === 'object') {
            child = {
              name,
              ...childCfgOrCaptureValue
            };
          }
          else {
            child = {
              name,
              captureValue: childCfgOrCaptureValue
            };
          }
        }
        else if (typeof child !== 'object') {
          throw new Error('invalid traceCfg: ' + visitorName + ' - ' + JSON.stringify(nodeCfg));
        }
        nodeCfg.children[i] = child;
      }
    }

    traceCfg[visitorName] = nodeCfg;
  }
  return traceCfg;
}

export function buildAllTraceVisitors() {
  const visitors = {};
  const traceCfg = normalizeConfig();
  validateCfg(traceCfg);

  for (const visitorName in traceCfg) {
    // TODO
    visitors[visitorName] = (path, state) => {
      
    };
  }
  return visitors;
}