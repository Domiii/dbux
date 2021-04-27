/**
 * @file
 * Slices are sets of program statements and/or expressions that 
 * affect (backward slices) or are affected by (forward slices) 
 * the slicing criterion (another statements and/or expressions, or set thereof).
 * 
 * Specifically, we focus on dynamic data slicing (as opposed to static or control slicing).
 * 
 * Dynamic data slicing tracks reads and writes
 * to reconstruct the dependency graph between variables/memory addresses.
 * 
 * Check out `samples\__samplesInput__\slicing` for examples.
*/

import TraceInstrumentationType from '../constants/TraceInstrumentationType';
// import InstrumentationDirection from '../constants/InstrumentationDirection';

/**
 * Determine the unique identifier of a variable or memory address.
 * This often requires a mix of build-time and run-time data.
 */
function buildLValId(...args) {
  // TODO
}

function getConstantString(idOrLiteral) {
  return idOrLiteral.value || idOrLiteral.name;
}

// ###########################################################################
// runtime computations
// ###########################################################################

/**
 * Get run time data for a unique LVal path.
 * E.g. the class that is currently being declared.
 * E.g. `this`
 */
function getRuntimeLValPathSegment(path) {
  // TODO
}

function getLValClassDeclaration(path) {
  // TODO
}

function getLValThis(path) {
  // TODO
}

function getExpressionVal(path) {
  // TODO
}

/**
 * Consider:
 *  ```js
    function setPKey(that, st key) { ... }
    function registerPropKeyValueAccess(that, st, value) {
      const key = getAndDeleteKey(that, st);
      register(st, {
        read: [
          that,
          key,
          value
        ],
        write: [
          that,
          objPath(that, key)
        ]
      });
    }
    function expr(st, val) { registerRead(st, val); return val; }
    function pKey(that, st, parentst, key) { console.log('pKey', that, key); setPKey(that, st, key); return key; }
    function pVal(that, st, parentst, val) { console.log('pVal', that, val); registerPropKeyValueAccess(that, st, val); return key; }

    var stF = 1
    var stFArg1 = 2
    var stFResult = 3;
    var stProp = 4;
    function f(x) { return 'f' + x; };
    class A {
      [pKey(this, stProp, 'p1', null)] = pVal(
        this, 
        stProp, 
        expr(stFResult, 
          expr(stF, f)(expr(stFArg1, 3))
        ),
        stFResult
       );
    }

    var a = new A();
    console.log(a.p1);
    ```
 */
function getClassPropertyId(path) {
  const { node: { computed, static: isStatic } } = path;
  const keyValue = computed ? getExpressionVal(path.get('key')) : getConstantString(path.node.key);
  if (isStatic) {
    return buildLValId(getLValClassDeclaration(path), keyValue);
  }
  return buildLValId(getLValThis(path), keyValue);
}

export function makeSliceTraceConfig() {
  const {
    NoTrace,
    // Callee,
    CallExpression,
    ExpressionResult,
    ExpressionValue,
    // ExpressionNoValue,
    Statement,
    Block,
    Loop,

    MemberProperty,
    MemberObject,
    Super,
    ReturnArgument,
    ReturnNoArgument,
    ThrowArgument,

    Function: Func,
    Await
  } = TraceInstrumentationType;

  return {
    // ########################################
    // assignments
    // ########################################
    AssignmentExpression: {
      to: 'left',
      from: 'right'
    },
    VariableDeclarator: {
      to: 'id',
      from: {
        id: 'init',
        optional: true
        // pre(path) {
        //   return !!path.node.init;
        // }
      }
    },
    ClassPrivateProperty: {
      to: {
        id: getClassPropertyId
      },
      from: 'value'
    },
    ClassProperty: {
      input() {

      },
      to: {
        id: getClassPropertyId
      },
      from: [
        'value',
        {
          id({ node: { key, computed } }) {
            if (computed) {
              return key;
            }
            return null;
          }
        }
      ]
    },


    // ########################################
    // call expressions
    // NOTE: also sync this against `isCallPath`
    // ########################################
    CallExpression: {

    },
    OptionalCallExpression: {
      CallExpression
    },
    NewExpression: {
      CallExpression
    },

    // ########################################
    // more expressions
    // ########################################
    /**
     * Ternary operator
     */
    ConditionalExpression: {
      // [['test', ExpressionResult}, ['consequent', ExpressionResult}, ['alternate', ExpressionResult]]
},

/**
 * ++ and --
 */
UpdateExpression: ExpressionResult,

  YieldExpression: {
  NoTrace,
    [['argument', ExpressionResult]]
},


// ########################################
// Data read expressions
// ########################################

BinaryExpression: {
  NoTrace,
    [['left', ExpressionValue}, ['right', ExpressionValue]]
    },

LogicalExpression: {
  NoTrace,
    [['left', ExpressionValue}, ['right', ExpressionValue]]
    },

// object initializer, e.g. rhs of `var o = { x: 1 }` (kind = 'init')
ObjectExpression: {
  NoTrace,
    [['properties', NoTrace,
      [['value', ExpressionValue]},
{ array: true }
      ]]
    },

MemberExpression: {
  NoTrace,
    [['object', MemberObject}, ['property', MemberProperty]]
    },

OptionalMemberExpression: {
  NoTrace,
    [['object', MemberObject}, ['property', MemberProperty]]
    },

SequenceExpression: {
  NoTrace,
    [['expressions', ExpressionValue, null, { array: true }]]
},

TemplateLiteral: {
  NoTrace,
    [['expressions', ExpressionValue, null, { array: true }]]
},

UnaryExpression: {
  NoTrace,
    [['argument', ExpressionValue]]
},

Super: {
  Super
},


// ########################################
// statements
// ########################################
BreakStatement: Statement,
  ContinueStatement: Statement,
    Decorator: {
  // NOTE: we need to trace decorators by wrapping them in a trace decorator
  NoTrace,
      // [['expression', ExpressionNoValue]]
    },
// Declaration: {
//   Statement,
//   null, // no children
//   {
//     ignore: {'ImportDeclaration'] // ignore: cannot mess with imports
//   }
// },

ReturnStatement: {
  ReturnNoArgument,
    [['argument', ReturnArgument]]
},
ThrowStatement: {
  NoTrace,
    [['argument', ThrowArgument]]
},


// ########################################
// loops
// ########################################
ForStatement: {
  Loop
},
ForInStatement: {
  Loop
},
ForOfStatement: {
  Loop
},
// TODO: babel is unhappy with any DoWhileLoop visitor
// DoWhileLoop: {
//   Loop
// },
WhileStatement: {
  Loop
},

// ########################################
// if, else, switch, case
// ########################################
IfStatement: {
  NoTrace,
    [['test', ExpressionResult}, ['consequent', Block}, ['alternate', Block]},
    },
      SwitchStatement: {
        NoTrace,
        [['discriminant', ExpressionResult]]
    },
      // SwitchCase: {
      // TODO: insert trace call into `consequent` array.
      //    NOTE: we cannot just wrap the `consequent` statement array into a new block, as that will change the semantics (specifically: local variables would not be able to spill into subsequent cases)
      //   NoTrace,
      //   [['consequent', Block]]
      // },


      // ########################################
      // try + catch
      // ########################################
      TryStatement: {
        NoTrace,
        // [['block', Block}, ['finalizer', Block]]
      },
      CatchClause: {
        NoTrace,
        [['body', Block]]
    },

      ExpressionStatement: {
        NoTrace,
        [['expression', ExpressionValue]]
    },

      // ########################################
      // functions
      // ########################################
      Function: {
        NoTrace,
        [['body', Func]]
    },

      // ########################################
      // await
      // ########################################
      AwaitExpression: {
        Await
      },

    // TODO: ParenthesizedExpression - https://github.com/babel/babel/blob/master/packages/babel-generator/src/generators/expressions.js#L27
    // TODO: BindExpression - https://github.com/babel/babel/blob/master/packages/babel-generator/src/generators/expressions.js#L224
    // TODO: TypeCastExpression
    // TODO: TupleExpression - https://github.com/babel/babel/blob/f6c7bf36cec81baaba8c37e572985bb59ca334b1/packages/babel-generator/src/generators/types.js#L139
  };
}