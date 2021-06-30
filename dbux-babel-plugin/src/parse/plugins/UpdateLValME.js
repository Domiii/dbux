import TraceType from '@dbux/common/src/core/constants/TraceType';
import BasePlugin from './BasePlugin';
import { LValHolderNode } from '../_types';
import { buildUpdateExpressionME } from '../../instrumentation/builders/updateExpressions';

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

  addReadTrace(objectAstNode, propertyAstNode, objectTid) {
    const [argumentNode] = this.node.getChildNodes();
    return this.node.Traces.addTrace({
      path: argumentNode.path,
      node: argumentNode,
      staticTraceData: {
        type: TraceType.ME
      },
      data: {
        objectTid,
        objectAstNode,
        propertyAstNode,
      },
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
    const [objectNode, propertyNode] = meNode.getChildNodes();

    const { computed } = meNode.path.node;

    // make sure, `object` + `property` are traced
    const objectTraceCfg = objectNode.addDefaultTrace();
    const objectTid = objectTraceCfg?.tidIdentifier;
    if (computed /* && !propertyPath.isConstantExpression() */) {
      // inputs.push(propertyPath);
      propertyNode.addDefaultTrace();
    }

    // prepare object
    const objectVar = path.scope.generateDeclaredUidIdentifier('o');

    // prepare property
    let propertyVar;
    if (computed) {
      propertyNode.addDefaultTrace();
      propertyVar = path.scope.generateDeclaredUidIdentifier('p');
    }

    // add read trace
    const readTraceCfg = this.addReadTrace(objectVar, propertyVar, objectTid);

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
        readTraceCfg,
        objectTid
      },
      meta: {
        build: buildUpdateExpressionME
      }
    };

    Traces.addTrace(traceData);
  }
}