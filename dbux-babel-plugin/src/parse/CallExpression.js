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

  // exit() {
  //   if (isCallPath(path)) {
  //     // call expressions get special treatment
  //     return wrapCallExpression(path, state);
  //   }
  // }

  // instrument() {
  //   // TODO: instrumentMemberCallExpressionEnter
  //   // TODO: instrumentDefaultCallExpressionEnter
  //   // TODO: static trace data
  //   // _callId = cfg?.callId || type === TraceType.BeforeCallExpression && _traceId;
  //   // _resultCallId = cfg?.resultCallId;
  // }
}