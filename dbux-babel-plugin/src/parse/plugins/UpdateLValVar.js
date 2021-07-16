import TraceType from '@dbux/common/src/types/constants/TraceType';
import BasePlugin from './BasePlugin';
import { LValHolderNode } from '../_types';
import { buildUpdateExpressionVar } from '../../instrumentation/builders/updateExpressions';

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

  addReadTrace() {
    // NOTE: same as `ReferencedIdentifier.createDefaultTrace`
    // NOTE2: `argumentNode.addDefaultTrace()` cannot work, since it's a `BindingIdentifier`, not a `ReferencedIdentifier`
    // const readTrace = argumentNode.addDefaultTrace();

    const [argumentNode] = this.node.getChildNodes();
    return this.node.Traces.addTrace({
      path: argumentNode.path,
      node: argumentNode,
      staticTraceData: {
        type: TraceType.Identifier
      },
      meta: {
        instrument: null
      }
    });
  }

  exit() {
    const { node } = this;
    const { path, Traces } = node;

    // make sure, argument is traced
    const readTraceCfg = this.addReadTrace();

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
        readTraceCfg
      },
      meta: {
        build: buildUpdateExpressionVar
      }
    };

    Traces.addTrace(traceData);
  }
}