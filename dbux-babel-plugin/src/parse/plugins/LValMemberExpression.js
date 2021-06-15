import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildTraceWriteME } from '../../instrumentation/builders/misc';
import ParsePlugin from '../../parseLib/ParsePlugin';

/**
 * @example
 * 
 * Two situations: "complex" (c) and "simple" (s)
 * 
 * Case c-1:
 * `a.b.c.prop = f(x)` ->
 * `rhs = te(f(x)), o = tme(...a.b.c...), o.prop = twME(rhs)`
 *
 * Case c-2: `CallExpression` object (not nested)
 * `f().y = f(x)` ->
 * `rhs = te(f(x)), o = tce(...f()...), o.prop = twME(rhs)`
 *
 * Case c-3:
 * `a.b.c[prop()] = f(x)` ->
 * `rhs = te(f(x)), o = tme(...a.b.c...), o[te(prop())] = twME(rhs)`
 *
 * Case c-4: nested CallExpression
 * `g(a).h(b).y = f(x)` ->
 * `rhs = te(f(x)), o = tcr(tc(tcr(tc(g)(ta(a))).h)(ta(b))), o.y = twME(rhs)`
 *
 * Case s-1: simplify if possible
 * `o.prop = f(x)` ->
 * `o.prop = twME(te(f(x)))`
 *
 * Case s-2: `super` TODO(trace `this` access for `super`)
 * `super.prop = f(x)` ->
 * `super.prop = twME(te(f(x)))`
 * ```
 * 
 * Case u-1: UpdateExpression
 * `++a[x]` ->
 * `tmME((o = a, ++o[te(x)]), tid...)`
 */
export default class LValMemberExpression extends ParsePlugin {
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
    const { node } = this;
    const { Traces } = node;

    const [meNode, rValNode] = node.getChildNodes();
    const [objectNode] = meNode.getChildNodes();

    // if (!rValNode.path.node) {
    //   // no write
    //   // NOTE: should never happen
    //   return;
    // }

    // make sure, `object` is traced
    objectNode.addDefaultTrace();

    const objTid = objectNode.traceCfg?.tidIdentifier;
    if (!objTid) {
      this.warn(`objectNode did not have traceCfg.tidIdentifier in ${objectNode}`);
    }

    // add actual WriteME trace
    const traceData = {
      staticTraceData: {
        type: TraceType.WriteME
      },
      data: {
        objTid
      },
      meta: {
        // instrument: Traces.instrumentTraceWrite
        build: buildTraceWriteME
      }
    };

    this.node.decorateWriteTraceData(traceData);

    Traces.addTraceWithInputs(traceData, [rValNode.path]);
  }
}