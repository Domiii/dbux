import { buildTryFinally } from '../helpers/builders';
import { buildEventStreamCall } from '../runtime/eventStreams';
import * as t from "@babel/types";

const visitedFunctions = new Set();

export function instrumentFunctionEventStream(path) {
  if (visitedFunctions.has(path)) {
    // NOTE: each node might be visited more than once
    return;
  }
  visitedFunctions.add(path);

  // TODO: executionContext is necessary to work with async stacks

  const executionContext = '"TODO"';
  const startCall = buildEventStreamCall(`push(${executionContext});`);
  const endCall = buildEventStreamCall(`pop(${executionContext});`);

  // wrap the function in a try/finally statement
  const fnBody = [startCall, ...path.get('body').node];
  const finallyBody = [endCall];
  path.get('body').replaceWith(t.blockStatement([buildTryFinally(fnBody, finallyBody)]));
}