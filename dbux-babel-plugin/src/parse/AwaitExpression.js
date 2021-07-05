
import template from "@babel/template";
import * as t from "@babel/types";
import TraceType from '@dbux/common/src/core/constants/TraceType';
import StaticContextType from '@dbux/common/src/core/constants/StaticContextType';
import { pathToString } from '../helpers/pathHelpers';
import BaseNode from './BaseNode';
import { buildTraceExpressionNoInput } from '../instrumentation/builders/misc';
import { buildWrapAwait } from '../instrumentation/builders/await';

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
    const awaitContextId = state.contexts.addStaticContext(path, {
      type: StaticContextType.Await,
      displayName: getAwaitDisplayName(path),
      resumeId
    });

    const awaitContextIdVar = Traces.generateDeclaredUidIdentifier('cid');
    const argumentPath = path.get('argument');
    const argument = argumentPath.node;

    const preTraceId = state.traces.addTrace(argumentPath, TraceType.Await, true);
    const resumeTraceId = state.traces.addTrace(path, TraceType.Resume, true);

    // trace argument
    Traces.addTrace({
      path: argumentPath,
      data: {
        awaitContextId,
        awaitContextIdVar
      },
      meta: {
        build: buildWrapAwait
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
            t.numericLiteral(awaitContextId),
            awaitContextIdVar,
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
