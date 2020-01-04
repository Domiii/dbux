import { guessFunctionName, getFunctionDisplayName } from '../helpers/functionHelpers';
import { buildWrapTryFinally, buildSource, buildBlock } from '../helpers/builders';
import template from '@babel/template';
import * as t from "@babel/types";

// ###########################################################################
// helpers
// ###########################################################################

function addResumeContext(bodyPath, state, staticId) {
  const { loc: bodyLoc } = bodyPath.node;

  // the "resume context" starts with the function (function is in "Resumed" state initially)
  const locStart = bodyLoc.start;
  return state.addResumeContext(staticId, locStart);
}

// ###########################################################################
// builders + templates
// ###########################################################################

function buildPushImmediate(contextId, dbux, staticId) {
  // TODO: use @babel/template instead
  return buildSource(`const ${contextId} = ${dbux}.pushImmediate(${staticId});`);
}

function buildPopImmediate(contextId, dbux) {
  // TODO: use @babel/template instead
  return buildSource(`${dbux}.popImmediate(${contextId});`);
}

const pushResumeTemplate = template(`
  %%dbux%%.pushResume(%%resumeStaticContextId%%, %%schedulerId%%);
`);

const popResumeTemplate = template(`
  %%dbux%%.popResume();
`);

// ###########################################################################
// modification
// ###########################################################################

/**
 * Instrument all Functions to keep track of all (possibly async) execution stacks.
 */
export function wrapFunctionBody(bodyPath, { ids: { dbux }, genContextIdName }, staticId, staticResumeId=null) {
  const contextIdVar = genContextIdName(bodyPath);

  let startCalls = buildPushImmediate(contextIdVar, dbux, staticId);
  let finallyBody = buildPopImmediate(contextIdVar, dbux);
  if (staticResumeId) {
    // this is an interruptable function -> push + pop "resume contexts"
    startCalls = [
      ...startCalls,
      ...pushResumeTemplate({
        dbux,
        resumeStaticContextId: t.numericLiteral(staticResumeId),
        schedulerId: t.numericLiteral(staticId)
      })
    ];

    finallyBody = [
      ...popResumeTemplate({
        dbux
        // contextId: contextIdVar
      }),
      ...finallyBody
    ];
  }

  let body = bodyPath.node;
  if (!Array.isArray(bodyPath.node) && !t.isStatement(bodyPath.node)) {
    // simple lambda expression -> convert to block lambda expression with return statement
    body = t.blockStatement([t.returnStatement(bodyPath.node)]);
  }

  // wrap the function in a try/finally statement
  bodyPath.replaceWith(buildBlock([
    ...startCalls,
    buildWrapTryFinally(body, finallyBody)
  ]));
}

// ###########################################################################
// visitor
// ###########################################################################

export default function functionVisitor() {
  return {
    enter(path, state) {
      if (!state.onEnter(path)) return;
      // console.warn('F', path.toString());

      const name = guessFunctionName(path);
      const displayName = getFunctionDisplayName(path);
      const isGenerator = path.node.generator;
      const isAsync = path.node.async;
      const isInterruptable = isGenerator || isAsync;
      const bodyPath = path.get('body');

      const staticContextData = {
        type: 2, // {StaticContextType}
        name,
        displayName,
        isInterruptable
      };
      const staticId = state.addStaticContext(path, staticContextData);
      let staticResumeId;
      if (isInterruptable) {
        staticResumeId = addResumeContext(bodyPath, state, staticId);
      }

      wrapFunctionBody(bodyPath, state, staticId, staticResumeId);

    }
  }
}