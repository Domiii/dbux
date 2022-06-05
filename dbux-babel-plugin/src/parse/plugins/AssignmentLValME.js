import TraceType from '@dbux/common/src/types/constants/TraceType';
import SyntaxType from '@dbux/common/src/types/constants/SyntaxType';
import BasePlugin from './BasePlugin';
import { LValHolderNode } from '../_types';
import { buildTraceWriteME } from '../../instrumentation/builders/me';
import MemberExpression from '../MemberExpression';
import { makeMETraceData } from '../helpers/me';

/**
 * Some examples: "chained (default)" (d) and "not chained (simple)" (s):
 * NOTE: we now do not distinguish between the two cases anymore.
 *    → All writes are now handled by {@link buildTraceWriteME}.
 * 
 * @example
 * Case d-1:
 * `a.b.c.prop = f(x)` ->
 * `twME(o = tme(a.b.c..., objectTid), p = 'prop', o[p] = te(f(x)..., rhsTid), tid, objectTid, rhsTid)`
 *
 * Case d-2:
 * `a.b.c[prop()] = f(x)` ->
 * `twME(o = tme(a.b.c..., objectTid), te(prop()...), te(f(x), rhsTid), tid, objectTid, rhsTid)`
 *
 * Case s-1: 
 * `o.prop = f(x)` ->
 * `twME(te(o..., objectTid), p = 'prop', o[p] = te(f(x)..., rhsTid), tid, objectTid, rhsTid)`
 *
 * Case s-2: `super`
 * TODO: NYI! - Cannot pass `super` as individual argument; must trace `Object.getPrototypeOf(this.constructor.prototype)` for `super`.
 * `super.prop = f(x)` ->
 * `twME(te(TODO..., objectTid), p = 'prop', super[p] = te(f(x)..., rhsTid), tid, objectTid, rhsTid)`
 */
export default class AssignmentLValME extends BasePlugin {
  /**
   * @type {LValHolderNode}
   */
  node;

  /**
   * @type {MemberExpression}
   */
  get meNode() {
    const [meNode] = this.node.getChildNodes();
    return meNode;
  }

  exit1() {
    const { meNode } = this;

    meNode.handler = this;
  }

  exit() {
    this.wrapLVal();
  }

  wrapLVal() {
    if (this.meNode.shouldIgnoreThisLVal()) {
      return;
    }

    const { node } = this;
    const { Traces } = node;
    const [, valuePath] = node.getChildPaths();

    const data = makeMETraceData(this.meNode);

    // add actual WriteME trace
    const traceData = {
      staticTraceData: {
        type: TraceType.WriteME,
        syntax: SyntaxType.AssignmentLValME,
        dataNode: {
          isNew: node.isNewValue?.() || false
        }
      },
      data,
      meta: {
        // instrument: Traces.instrumentTraceWrite
        build: buildTraceWriteME
      }
    };

    node.decorateWriteTraceData(traceData);

    Traces.addTraceWithInputs(traceData, [valuePath]);
  }
}