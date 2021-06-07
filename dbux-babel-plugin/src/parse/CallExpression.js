// import { instrumentCallExpressionEnter } from '../zz_archive/traceHelpers.old';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { traceCallExpressionDefault } from '../instrumentation/callExpressions';
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

function getStaticArgumentCfg(argPath) {
  return {
    isSpread: argPath.node.type === 'SpreadElement'
  };
}

const CalleePluginsByType = {
  // default!
  // Identifier: 'CalleeIdentifier',
  // CallExpression: 'CalleeCallExpression',

  /**
   * ME
   */
  MemberExpression: 'CalleeMemberExpression'
};

function getCalleePlugin(node) {
  const [calleePath] = node.getChildPaths();
  const { type } = calleePath.node;
  let pluginName = CalleePluginsByType[type];
  // if (!pluginName) {
  //   // node.logger.error(`unknown callee type: "${type}" at "${pathToString(calleePath)}"`);
  // }
  return pluginName;
}

/**
 * NOTE: the name chosen here will show up in error messages
 */
function generateCalleeVar(calleePath) {
  const id = calleePath.scope.generateUidIdentifierBasedOnNode(calleePath.node);
  calleePath.scope.push({
    id
  });
  return id;
  // return calleePath.node.name || 'func';
}


// ###########################################################################
// CallExpression
// ###########################################################################


export default class CallExpression extends BaseNode {
  static visitors = [
    `CallExpression`,
    `OptionalCallExpression`,
    `NewExpression`
  ];
  static plugins = [
    (node) => node.calleePluginName
  ];
  static children = ['callee', 'arguments'];

  calleePluginName;

  init() {
    this.calleePluginName = getCalleePlugin(this) || null;
  }

  get calleePlugin() {
    return this.calleePluginName && this.getPlugin(this.calleePluginName) || null;
  }

  // function enterCallExpression(traceResultType, path, state) {
  //   // CallExpression

  //   // TODO: need to fix for parameter assignments in function declarations: 
  //   //      -> `function f(x = o.g()) { }`
  //   //      NOTE: in this case, utility variables are allocated inside function; but that would change semantics.
  //   const parent = path.parentPath;
  //   const grandParent = path.parentPath?.parentPath;
  //   if (grandParent &&
  //     t.isFunction(grandParent) &&
  //     grandParent.node.params.includes(parent.node)
  //   ) {
  //     // ignore
  //   }
  //   else {
  //     path = instrumentCallExpressionEnter(path, state);
  //     path.setData('traceResultType', traceResultType);
  //   }
  // }


  exit() {
    // TODO: more special cases - super, import, require
    //    -> cannot separate callee for `super` or `import`
    //    -> cannot modify args for `import` or `require`, if they are constants
    const { 
      path,
      // path: { scope },
      calleePlugin
    } = this;


    /**
     * TODO:
     * 1. special case: `calleePath.isMemberExpression()`
     * 2. special case: `calleePath.isCallExpression()`
     * 3. special case: built-in functions
     *    * some built-ins are called with one set of arguments and then call our function with another
     * 4. special case: `bind` etc.
     */

    const [calleePath, argumentPaths] = this.getChildPaths();
    // const [calleeNode, argumentNodes] = this.getChildNodes();

    // 1. make sure, callee is traced
    this.Traces.addDefaultTrace(calleePath);

    // 2. trace args + 3. BCE
    const bceTraceData = {
      path,
      // node: this,
      staticTraceData: {
        type: TraceType.BeforeCallExpression,
        dataNode: {
          argConfigs: argumentPaths?.map(getStaticArgumentCfg) || EmptyArray
        }
      },
      meta: {
        // NOTE: will be instrumented by `CallExpressionResult`
        instrument: null
      }
    };
    const bceInputPaths = argumentPaths || EmptyArray;
    const bceTrace = this.Traces.addTraceWithInputs(bceTraceData, bceInputPaths);

    /**
     * @see `CalleeMemberExpression`
     */
    const instrument = calleePlugin?.instrumentCallExpression || traceCallExpressionDefault;
    const bceTidIdentifier = bceTrace.tidIdentifier;

    // 4. wrap `CallExpression` (as `CallExpressionResult`)
    const trace = this.Traces.addTrace({
      path,
      node: this,
      staticTraceData: {
        type: TraceType.CallExpressionResult
      },
      data: {
        bceTrace,
        calleeVar: generateCalleeVar(calleePath)
      },
      meta: {
        traceCall: 'traceCallResult',
        instrument,
        moreTraceCallArgs: [bceTidIdentifier]
      }
    });

    // 5. callee might need modifications
    calleePlugin?.handleCallTrace(trace);
  }
}