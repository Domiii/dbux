// import { instrumentCallExpressionEnter } from '../zz_archive/traceHelpers.old';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildTraceCallArgument, buildTraceExpressionNoInput, buildTraceExpressionSimple } from '../instrumentation/builders/trace';
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

export default class CallExpression extends BaseNode {
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
    const [calleePath, argumentPaths] = this.getChildPaths();
    const [calleeNode, argumentNodes] = this.getChildNodes();

    const calleeTraceData = {
      path: calleePath,
      node: calleeNode,
      staticTraceData: {
        type: TraceType.BeforeCallExpression
      },
      meta: {
        traceCall: 'traceCallee',
      }
    };
    const calleeTrace = this.Traces.addTrace(calleeTraceData);

    const calleeTidIdentifier = calleeTrace.tidIdentifier;

    for (let i = 0; i < argumentPaths.length; ++i) {
      const argPath = argumentPaths[i];
      const argNode = argumentNodes[i];
      this.Traces.addTrace({
        path: argPath,
        node: argNode,
        staticTraceData: {
          type: TraceType.CallArgument
        },
        meta: {
          build: buildTraceExpressionNoInput,
          traceCall: 'traceCallArgument',
          moreTraceCallArgs: [calleeTidIdentifier]
        }
      });
    }

    this.Traces.addTrace({
      path: this.path,
      node: this,
      staticTraceData: {
        type: TraceType.CallExpressionResult
      },
      meta: {
        build: buildTraceExpressionSimple,
        traceCall: 'traceCallResult',
        moreTraceCallArgs: [calleeTidIdentifier]
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