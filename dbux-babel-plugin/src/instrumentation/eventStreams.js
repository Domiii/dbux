import { buildTryFinally } from '../helpers/builders';
import { buildEventStreamCall } from '../runtime/eventStreams';
import * as t from "@babel/types";


export function instrumentAwaitEventStream(bodyPath) {
  // TODO: https://babeljs.io/docs/en/babel-types#forofstatement -- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
  //
}

/**
 * Instrument all Functions and Program to keep track of all (possibly async) execution stacks.
 */
export function instrumentInstructionFlowEventStream(bodyPath) {
  // TODO: executionContext is necessary to work with async stacks

  const executionContext = '"TODO"';
  const startCall = buildEventStreamCall(`push(${executionContext});`);
  const endCall = buildEventStreamCall(`pop(${executionContext});`);

  // wrap the function in a try/finally statement
  const fnBody = [startCall, ...bodyPath.node];
  const finallyBody = [endCall];
  bodyPath.replaceWith(t.blockStatement([buildTryFinally(fnBody, finallyBody)]));
}