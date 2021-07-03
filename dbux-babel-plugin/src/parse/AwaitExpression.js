
import template from "@babel/template";
import * as t from "@babel/types";
import TraceType from '@dbux/common/src/core/constants/TraceType';
import StaticContextType from '@dbux/common/src/core/constants/StaticContextType';
import { pathToString } from '../helpers/pathHelpers';
import { isPathInstrumented } from '../helpers/astUtil';
import BaseNode from './BaseNode';
import { buildTraceExpressionNoInput } from '../instrumentation/builders/misc';

// ###########################################################################
// builders
// ###########################################################################

// WARNING: id must be passed AFTER awaitNode, 
//    because else it will be undefined.
//    The value will be bound before `await` and thus before `preAwait` was called.
const postAwaitTemplate = template(`
%%postAwait%%(
  %%awaitNode%%,
  %%awaitContextId%%,
  %%resumeTraceId%%
)`);

const wrapAwaitExpressionTemplate = template(`
(%%wrapAwait%%(%%argument%%, %%awaitContextId%% = %%dbux%%.preAwait(%%contextId%%, %%preTraceId%%)))
`);


function getAwaitDisplayName(path) {
  return `(${pathToString(path)})`;
}


// ###########################################################################
// visitor
// ###########################################################################


export default class AwaitExpression extends BaseNode {
  static children = ['argument'];

  addResumeContext() {
    const {
      path,
      state,
      Traces
    } = this;

    // NOTE: the "resume context" starts after the await statement
    const { loc: awaitLoc } = path.node;
    const locStart = awaitLoc.end;
    return state.contexts.addResumeContext(path, locStart);
  }

  /**
   * Assumption: `path` has already been instrumented with `wrapAwait`.
   */
  exit() {
    const [argumentNode] = this.getChildNodes();
    argumentNode.addDefaultTrace();

    const {
      path,
      state,
      Traces
    } = this;

    const resumeId = this.addResumeContext();
    const contextId = state.contexts.addStaticContext(path, {
      type: StaticContextType.Await,
      displayName: getAwaitDisplayName(path),
      resumeId
    });

    const awaitContextId = Traces.generateDeclaredUidIdentifier('cid');
    const argumentPath = path.get('argument');
    const argument = argumentPath.node;

    const preTraceId = state.traces.addTrace(argumentPath, TraceType.Await, true);
    const resumeTraceId = state.traces.addTrace(path, TraceType.Resume, true);

    // trace argument
    Traces.addTrace({
      path: argumentPath,
      meta: {
        traceCall: 'wrapAwait',
        build: buildTraceExpressionNoInput,
        moreTraceCallArgs() {
          return [
            t.numericLiteral(contextId),
            awaitContextId,
            t.numericLiteral(preTraceId),
            argument
          ];
        }
      }
    });

    // trace self
    Traces.addTrace({
      path,
      node: this,
      meta: {
        traceCall: 'postAwait',
        build: buildTraceExpressionNoInput,
        moreTraceCallArgs() {
          return [
            t.numericLiteral(contextId),
            awaitContextId,
            t.numericLiteral(preTraceId),
            argument
          ];
        }
      }
    });
  }

  instrumentSelf() {
    const awaitReplacement = postAwaitTemplate({
      dbux,
      awaitNode: path.node,
      awaitContextId,
      resumeTraceId: t.numericLiteral(resumeTraceId)
    });
    path.replaceWith(awaitReplacement);
  }
}
