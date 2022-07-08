import TraceType from '@dbux/common/src/types/constants/TraceType';
import BasePlugin from './BasePlugin';
import { LValHolderNode } from '../_types';
import { buildUpdateExpressionME } from '../../instrumentation/builders/updateExpressions';
import { makeMETraceData } from '../helpers/me';

/**
 * [ME]
 * 
 * @example
 * 
 * Case d-1:
 * `++a.b.c.prop` ->
 * `twME(o = tme(a.b.c..., objectTid), p = 'prop', o[p] = te(o[p], ...readTid) + 1, writeTid, objectTid, readTid)`
 *
 * Case d-2:
 * `++a.b.c[prop()]` ->
 * `twME(o = tme(a.b.c..., objectTid), p = te(prop()...), ++o[p], readTid, writeTid, objectTid)`
 *
 * Case s-1: simplify object if possible
 * `++q.prop` ->
 * `twME(te(q..., objectTid), p = 'prop', ++q[p], readTid, writeTid, objectTid)`
 *
 * Case s-2: `super`
 * TODO: NYI! - Cannot pass `super` as individual argument; must trace `Object.getPrototypeOf(this.constructor.prototype)` for `super`.
 * `++super[f()]` ->
 * `twME(te(TODO..., objectTid), p = te(f()...), ++super[p], readTid, writeTid, objectTid))`
 */
export default class UpdateLValME extends BasePlugin {
  /**
   * @type {LValHolderNode}
   */
  node;

  get meNode() {
    const [meNode] = this.node.getChildNodes();
    return meNode;
  }

  exit1() {
    const { meNode } = this;
    meNode.handler = this;
  }

  addReadTrace(meNode) {
    return this.node.Traces.addTrace({
      path: meNode.path,
      node: meNode,
      staticTraceData: {
        type: TraceType.ME
      },
      data: {},
      meta: {
        // will be instrumented by `buildUpdateExpressionME`
        instrument: null
      }
    });
  }

  exit() {
    const { node } = this;
    const { path, Traces } = node;
    const [meNode] = node.getChildNodes();

    /**
     * NOTE: we pass {@link readTraceCfg} down to the ME builder, so it needs to have all the data
     */
    const readTraceCfg = this.addReadTrace(meNode);
    readTraceCfg.data = makeMETraceData(meNode, true);

    // add actual WriteME trace
    const traceData = {
      path,
      node,
      staticTraceData: {
        type: TraceType.UpdateExpression,
        dataNode: {
          isNew: true
        }
      },
      data: {
        readTraceCfg
      },
      meta: {
        build: buildUpdateExpressionME
      }
    };

    Traces.addTrace(traceData);
  }
}