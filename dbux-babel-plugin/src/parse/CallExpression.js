import { instrumentCallExpressionEnter } from '../zz_archive/traceHelpers.old';
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

  //   //   //      NOTE: in this case, utility variables are allocated inside function; but that would change semantics.
  //   //   const parent = path.parentPath;
  //   //   const grandParent = path.parentPath?.parentPath;
  //   //   if (grandParent &&
  //   //     t.isFunction(grandParent) &&
  //   //     grandParent.node.params.includes(parent.node)
  //   //   ) {
  //   //     // ignore
  //   //     // TODO: need to fix for parameter assignments in function declarations: `function f(x = o.g()) { }`
  //   //   }
  //   //   else {
  //   //     path = instrumentCallExpressionEnter(path, state);
  //   //     path.setData('traceResultType', traceResultType);
  //   //   }
  //   // }
  // }

  exit() {
    // TODO: static trace data
    
    // TODO: get/instrument/manage bcePath
    // const bcePathId = callPath.getData('_bcePathId');
    // const bcePath = bcePathId && callPath.parentPath.get(bcePathId) || null;
    
    // TODO: set argument.callId = beforeCallTraceId

    // TODO: set callId + resultCallId
    // // _callId = cfg?.callId || type === TraceType.BeforeCallExpression && _traceId;
    // // _resultCallId = cfg?.resultCallId;
  }

  instrument() {
    const { path, state } = this;
    instrumentCallExpressionEnter(path, state);
    // TODO: instrumentMemberCallExpressionEnter
    // TODO: instrumentDefaultCallExpressionEnter
  }
}