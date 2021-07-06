import TraceType from '@dbux/common/src/core/constants/TraceType';
import StaticContextType from '@dbux/common/src/core/constants/StaticContextType';
import { pathToString } from '../helpers/pathHelpers';
import BaseNode from './BaseNode';
import { buildPostAwait, buildWrapAwait } from '../instrumentation/builders/await';

// ###########################################################################
// builders
// ###########################################################################


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
      state
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
    const {
      path,
      state,
      Traces
    } = this;

    const [argumentNode] = this.getChildNodes();
    argumentNode.addDefaultTrace();

    const resumeId = this.addResumeContext();
    const awaitContextId = state.contexts.addStaticContext(path, {
      type: StaticContextType.Await,
      displayName: getAwaitDisplayName(path),
      resumeId
    });

    const awaitContextIdVar = Traces.generateDeclaredUidIdentifier('resumeCid');
    const argumentVar = Traces.generateDeclaredUidIdentifier('arg');
    const resultVar = Traces.generateDeclaredUidIdentifier('res');
    const argumentPath = argumentNode.path;

    // pre trace
    Traces.addTrace({
      path: argumentPath,
      staticTraceData: {
        type: TraceType.Await
      },
      data: {
        argumentVar,
        awaitContextId,
        awaitContextIdVar
      },
      meta: {
        build: buildWrapAwait
      }
    });

    // const staticPushTraceId = state.traces.addTrace(path, {
    //   type: TraceType.Resume
    // });

    // trace self
    Traces.addTrace({
      path,
      node: this,
      staticTraceData: {
        type: TraceType.Resume
      },
      data: {
        argumentVar,
        resultVar,
        awaitContextIdVar
      },
      meta: {
        build: buildPostAwait
      }
    });
  }
}
