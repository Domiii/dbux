import TraceType from '@dbux/common/src/core/constants/TraceType';
import BasePlugin from './BasePlugin';
import { LValHolderNode } from '../_types';
import { buildTraceWriteME } from '../../instrumentation/builders/misc';

/**
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

  exit() {
    this.wrapLVal();
  }

  wrapLVal() {
    const { node } = this;
    const { Traces } = node;

    const [meNode] = node.getChildNodes();
    const [objectNode] = meNode.getChildNodes();

    // make sure, `object` is traced
    const objectTraceCfg = objectNode.addDefaultTrace();
    const objTid = objectTraceCfg?.tidIdentifier;
    if (!objTid) {
      this.warn(`objectNode did not have traceCfg.tidIdentifier in ME ${meNode}`);
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

    Traces.addTraceWithInputs(traceData, [valueNode.path]);
  }
}