// import { instrumentCallExpressionEnter } from '../zz_archive/traceHelpers.old';
import { isNotTraceable } from '@dbux/common/src/core/constants/SpecialIdentifierType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { makeSpreadableArgumentArrayCfg } from '../helpers/argsUtil';
import { traceCallExpressionDefault } from '../instrumentation/callExpressions';
import BaseNode from './BaseNode';


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


function canTraceCallee(calleeNode) {
  const { specialType } = calleeNode;
  return !specialType || !isNotTraceable(specialType);
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
    {
      plugin: getCalleePlugin,
      alias: 'callee'
    }
  ];
  static children = ['callee', 'arguments'];

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
      plugins: {
        callee: calleePlugin
      }
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
    const [calleeNode/* , argumentNodes */] = this.getChildNodes();

    // 1. make sure, callee is traced (if is traceable)
    let calleeVar = null;
    const isCalleeTraced = canTraceCallee(calleeNode);
    if (isCalleeTraced) {
      this.Traces.addDefaultTrace(calleePath);
      calleeVar = generateCalleeVar(calleePath);
    }

    // 2. trace args + 3. BCE
    const bceTraceData = {
      path,
      // node: this,
      staticTraceData: {
        type: TraceType.BeforeCallExpression,
        data: {
          argConfigs: makeSpreadableArgumentArrayCfg(argumentPaths),
        }
      },
      meta: {
        // NOTE: will be instrumented by `CallExpressionResult`
        instrument: null
      }
    };

    if (!isCalleeTraced) {
      // hackfix: since we cannot trace the callee, just add it's specialType to BCE
      bceTraceData.staticTraceData.data.specialType = calleeNode.specialType;
    }

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
        calleeVar
      },
      meta: {
        traceCall: 'traceCallResult',
        instrument,
        moreTraceCallArgs: [bceTidIdentifier]
      }
    });

    // 5. callee might add modifications
    calleePlugin?.decorateCallTrace(trace);
  }
}