import TraceType from '@dbux/common/src/core/constants/TraceType';
import BasePlugin from './BasePlugin';
import { LValHolderNode } from '../_types';
import { buildTraceWriteME } from '../../instrumentation/builders/misc';
import { buildUpdateVar } from '../../instrumentation/builders/updateExpressions';

/**
 * @example
 * 
 * `++a` ->
 * `twME(a = _tmp = te(a, ...readTid) + 1, _tmp, readTid, writeTid, declarationTid)`
 * 
 * `a++` ->
 * `twME(a = (_tmp = te(a, ...readTid)) + 1, _tmp, readTid, writeTid, declarationTid)`
 * 
 */
export default class UpdateLValME extends BasePlugin {
  /**
   * @type {LValHolderNode}
   */
  node;

  exit() {
    const { node } = this;
    const { path, Traces } = node;

    const [argumentNode] = this.node.getChildNodes();

    // make sure, argument is traced
    // TODO: addDefaultTrace is not going to work, since it's a `BindingIdentifier`, not a `ReferencedIdentifier`
    const readTrace = argumentNode.addDefaultTrace();
    const readTid = readTrace?.tidIdentifier;

    // add trace
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
        readTid
      },
      meta: {
        build: buildUpdateVar
      }
    };

    Traces.addTrace(traceData);
  }
}