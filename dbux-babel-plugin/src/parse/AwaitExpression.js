import TraceType from '@dbux/common/src/types/constants/TraceType';
import StaticContextType from '@dbux/common/src/types/constants/StaticContextType';
import { pathToString } from '../helpers/pathHelpers';
import BaseNode from './BaseNode';
import { buildPostAwait, buildWrapAwait } from '../instrumentation/builders/await';

// ###########################################################################
// util
// ###########################################################################


function getAwaitDisplayName(path) {
  return `(${pathToString(path)})`;
}


/** ###########################################################################
 * {@link AwaitExpression}
 * ##########################################################################*/

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
    return state.contexts.addResumeContext(path, locStart, StaticContextType.ResumeAsync);
  }

  enter() {
    const {
      Traces
    } = this;

    // future-work: don't use unnamed constants ('awCid')
    // NOTE: we need `awaitContextIdVar` to better deal with asynchronous error handling, in catch and finally blocks
    this.awaitContextIdVar = Traces.getOrGenerateUniqueIdentifier('awCid');
  }

  /**
   * Assumption: `path` has already been instrumented with `wrapAwait`.
   */
  exit() {
    const {
      path,
      state,
      awaitContextIdVar,
      Traces
    } = this;

    const [argumentNode] = this.getChildNodes();
    argumentNode.addDefaultTrace();

    const realContextIdVar = this.getRealContextIdVar();
    
    const resumeId = this.addResumeContext();
    const awaitStaticContextId = state.contexts.addStaticContext(path, {
      type: StaticContextType.Await,
      displayName: getAwaitDisplayName(path),
      resumeId
    });

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
        awaitStaticContextId,
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
      staticTraceData: {
        type: TraceType.ResumeAsync
      },
      data: {
        argumentVar,
        resultVar,
        realContextIdVar,
        awaitContextIdVar
      },
      meta: {
        build: buildPostAwait
      }
    });
  }
}
