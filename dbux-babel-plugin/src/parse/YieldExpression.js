import TraceType from '@dbux/common/src/types/constants/TraceType';
import StaticContextType from '@dbux/common/src/types/constants/StaticContextType';
import BaseNode from './BaseNode';
import { buildPostYield, buildWrapYield } from '../instrumentation/builders/yield';

/** ###########################################################################
 * {@link YieldExpression}
 * ##########################################################################*/

export default class YieldExpression extends BaseNode {
  static children = ['argument'];

  addResumeContext() {
    const {
      path,
      state
    } = this;

    // NOTE: the "resume context" starts after the yield statement
    const { loc: yieldLoc } = path.node;
    const locStart = yieldLoc.end;
    return state.contexts.addResumeContext(path, locStart, StaticContextType.ResumeGen);
  }

  /**
   * Assumption: `path` has already been instrumented with `wrapYield`.
   */
  exit() {
    const {
      path,
      // state,
      Traces
    } = this;

    const [argumentNode] = this.getChildNodes();
    argumentNode?.addDefaultTrace();

    const argumentVar = Traces.generateDeclaredUidIdentifier('arg');
    const resultVar = Traces.generateDeclaredUidIdentifier('res');
    const argumentPath = argumentNode.path;

    // pre trace
    Traces.addTrace({
      path: argumentPath,
      staticTraceData: {
        type: TraceType.Yield
      },
      data: {
        argumentVar
      },
      meta: {
        build: buildWrapYield
      }
    });

    // trace self
    Traces.addTrace({
      path,
      node: this,
      staticTraceData: {
        type: TraceType.ResumeGen
      },
      data: {
        argumentVar,
        resultVar
      },
      meta: {
        build: buildPostYield
      }
    });
  }
}
