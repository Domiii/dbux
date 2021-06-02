// import { instrumentCallExpressionEnter } from '../zz_archive/traceHelpers.old';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildTraceExpressionNoInput, buildTraceExpressionSimple } from '../instrumentation/builders/misc';
import BaseNode from './BaseNode';

// function wrapCallExpression(path, state) {
//   // CallExpression
//   // instrument args after everything else has already been done

//   // const calleePath = path.get('callee');
//   // const beforeCallTraceId = getPathTraceId(calleePath);
//   // traceCallExpression(path, state, beforeCallTraceId);

//   // TODO: instrument BCE as well, here

//   let traceResultType = path.getData('traceResultType');
//   if (!traceResultType || TraceType.is.ExpressionResult(traceResultType) || TraceType.is.ExpressionValue(traceResultType)) {
//     traceResultType = TraceType.CallExpressionResult;
//   }
//   return traceCallExpression(path, state, traceResultType);
// }

function getArgumentCfg(node) {
  return {
    isSpread: node.type === 'SpreadElement'
  };
}

export default class CallExpression extends BaseNode {
  static visitors = [
    `CallExpression`,
    `OptionalCallExpression`,
    `NewExpression`
  ];
  static children = ['callee', 'arguments'];

  // enter() {
  //   // function enterCallExpression(traceResultType, path, state) {
  //   //   // CallExpression

  //   //   // TODO: need to fix for parameter assignments in function declarations: `function f(x = o.g()) { }`
  //   //   //      NOTE: in this case, utility variables are allocated inside function; but that would change semantics.
  //   //   const parent = path.parentPath;
  //   //   const grandParent = path.parentPath?.parentPath;
  //   //   if (grandParent &&
  //   //     t.isFunction(grandParent) &&
  //   //     grandParent.node.params.includes(parent.node)
  //   //   ) {
  //   //     // ignore
  //   //   }
  //   //   else {
  //   //     path = instrumentCallExpressionEnter(path, state);
  //   //     path.setData('traceResultType', traceResultType);
  //   //   }
  //   // }
  // }

  exit() {
    // TODO: more special cases - super, import, require
    //    -> cannot separate callee for `super` or `import`
    //    -> cannot modify args for `import` or `require`, if they are constants
    const { path } = this;


    const [calleePath, argumentPath] = this.getChildPaths();
    // const [calleeNode, argumentNodes] = this.getChildNodes();

    /**
     * TODO:
     * 1. special case: `calleePath.isMemberExpression()`
     * 2. special case: `calleePath.isCallExpression()`
     * 3. special case: built-in functions
     *    * some built-ins are called with one set of arguments and then call our function with another
     * 4. special case: `bind` etc.
     */

    // 1. trace callee
    this.Traces.addDefaultTrace(calleePath);

    // 2. trace args + 3. BCE
    const bceTraceData = {
      path,
      // node: this,
      staticTraceData: {
        type: TraceType.BeforeCallExpression,
        dataNode: {
          argConfigs: argumentPath.node.map(getArgumentCfg)
        }
      },
      meta: {
        // NOTE: will be instrumented by `CallExpressionResult`
        instrument: null
      }
    };
    const bceInputs = argumentPath.node.map((_, i) => argumentPath.get(i));
    const bceTrace = this.Traces.addTraceWithInputs(bceTraceData, bceInputs);
    const bceTidIdentifier = bceTrace.tidIdentifier;
    
    // 4. wrap `CallExpression` (as `CallExpressionResult`)
    this.Traces.addTrace({
      path: this.path,
      node: this,
      staticTraceData: {
        type: TraceType.CallExpressionResult
      },
      data: {
        bceTrace
      },
      meta: {
        instrument: this.Traces.instrumentCallExpression,
        moreTraceCallArgs: [bceTidIdentifier]
      }
    });
  }

  instrument() {
    // const { path, state } = this;
    // instrumentCallExpressionEnter(path, state);
    // TODO: instrumentMemberCallExpressionEnter
    // TODO: instrumentDefaultCallExpressionEnter
  }
}