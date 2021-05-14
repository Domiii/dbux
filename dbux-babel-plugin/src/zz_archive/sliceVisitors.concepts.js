/**
 * @file
 * Slices are sets of program statements and/or expressions that 
 * affect (backward slices) or are affected by (forward slices) 
 * the slicing criterion (another statements and/or expressions, or set thereof).
 * 
 * Specifically, we focus on dynamic data slicing (as opposed to static or control slicing).
 * 
 * Dynamic data slicing tracks reads and outs
 * to reconstruct the dependency graph between variables/memory addresses.
 * 
 * Check out `visit.md` and `samples\__samplesInput__\slicing` for more information and samples.
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
    // NoTrace,
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
    // outs
    // ########################################
    AssignmentExpression: {
      out: 'left',
      in: 'right'
    },

    VariableDeclarator: {
      out: 'id',
      in: {
        id: 'init',
        optional: true
        // pre(path) {
        //   return !!path.node.init;
        // }
      }
    },

    ClassPrivateProperty: {
      out: {
        id: getClassPropertyId
      },
      in: 'value'
    },

    ClassProperty: {
      // input() {

      // },
      out: {
        id: getClassPropertyId
      },
      in: [
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
      // CEs are more complex
      // arguments are written to function parameter assignments
      // and function return/yield values are written to whoever has the CE as read input.
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
      // [['test', ExpressionResult], ['consequent', ExpressionResult], ['alternate', ExpressionResult]]
    },

    /**
     * ++ and --
     */
    UpdateExpression: ExpressionResult,


    // ########################################
    // Data read expressions
    // ########################################

    BinaryExpression: {
      // NoTrace,
      // [['left', ExpressionValue}, ['right', ExpressionValue]]
    },

    LogicalExpression: {
      // NoTrace,
      // [['left', ExpressionValue}, ['right', ExpressionValue]]
    },

    // object initializer, e.g. rhs (`init`) of `var o = { x: 1 }`
    ObjectExpression: {
      // NoTrace,
      //     [['properties', NoTrace,
      //       // [['value', ExpressionValue]},
      // { array: true }
      //       ]]
    },

    MemberExpression: {
      // NoTrace,
      // [['object', MemberObject}, ['property', MemberProperty]]
    },

    OptionalMemberExpression: {
      // NoTrace,
      // [['object', MemberObject}, ['property', MemberProperty]]
    },

    SequenceExpression: {
      // NoTrace,
      // [['expressions', ExpressionValue, null, { array: true }]]
    },

    TemplateLiteral: {
      // NoTrace,
      // [['expressions', ExpressionValue, null, { array: true }]]
    },

    UnaryExpression: {
      // NoTrace,
      // [['argument', ExpressionValue]]
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
      // NoTrace,
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
      // [['argument', ReturnArgument]]
    },

    YieldExpression: {
      // NoTrace,
      // [['argument', ExpressionResult]]
    },

    ThrowStatement: {
      // NoTrace,
      // [['argument', ThrowArgument]]
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
      // NoTrace,
      // [['test', ExpressionResult}, ['consequent', Block}, ['alternate', Block]},
    },
    SwitchStatement: {
      // NoTrace,
      // [['discriminant', ExpressionResult]]
    },
    // SwitchCase: {
    // TODO: insert trace call into `consequent` array.
    //    NOTE: we cannot just wrap the `consequent` statement array into a new block, as that will change the semantics (specifically: local variables would not be able to spill into subsequent cases)
    // },


    // ########################################
    // try + catch
    // ########################################
    TryStatement: {
      // NoTrace,
      // [['block', Block}, ['finalizer', Block]]
    },
    CatchClause: {
      // NoTrace,
      // [['body', Block]]
    },

    ExpressionStatement: {
      // NoTrace,
      // [['expression', ExpressionValue]]
    },

    // ########################################
    // functions
    // ########################################
    Function: {
      // NoTrace,
      // [['body', Func]]
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