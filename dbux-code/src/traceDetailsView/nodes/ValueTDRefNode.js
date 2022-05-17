import { isPruneStateOk, ValuePruneState } from '@dbux/common/src/types/constants/ValueTypeCategory';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import { emitValueRenderAction } from '../../userEvents';
// import { makeTreeItemNoChildren } from '../../helpers/makeTreeItem';
import EmptyTreeViewNode from '../../codeUtil/treeView/EmptyNode';
import { valueRender } from '../valueRender';
import ValueNode, { ValueLabel } from './ValueNode';
import ValueTDSimpleNode from './ValueTDSimpleNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/**
 * Node represents an complex value, use `ValueNode.entry.refId` + `ValueNode.rootDataNode.nodeId`(as terminalNodeId) to render.
 * NOTE: `ValueTDRefNode.entry` might be inaccurate, since a ValueRef may not have a corresponding DataNode
 */
export default class ValueTDRefNode extends ValueNode {
  /**
   * For root node only.
   * @param {Trace} trace 
   */
  static makeEntry(trace, parent, props) {
    const { traceId, applicationId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    if (dataNode && dataNode.refId && dp.collections.values.getById(dataNode.refId)) {
      return dataNode;
    }

    return null;
  }

  /**
   * For root node only.
   */
  static makeProperties(dataNode, parent, props) {
    if (!parent) {
      return {
        refId: dataNode.refId,
        rootDataNode: dataNode,
      };
    }
    else {
      return null;
    }
  }

  static makeLabel(dataNode, parent, { key }) {
    if (!parent) {
      key = ValueLabel;
    }
    return `${key}:`;
  }

  get dataNode() {
    return this.entry;
  }

  get valueRef() {
    return this.dp.collections.values.getById(this.refId);
  }

  init() {
    super.init();

    const { rootDataNode } = this;
    const { typeName } = this.valueRef;
    const typeLabel = typeName ? ` (${typeName})` : '';
    this.description = `${this.dp.util.getValueRefValueStringShort(this.refId, rootDataNode.nodeId)}${typeLabel}`;
  }

  buildChildren() {
    const { rootDataNode, dp, refId, valueRef } = this;
    const snapshot = dp.util.constructValueSnapshotAtTime(refId, rootDataNode.nodeId);

    if (!isPruneStateOk(valueRef.pruneState)) {
      return EmptyArray;
    }

    if (snapshot?.children) {
      return Object.entries(snapshot.children)
        .map(([key, { nodeId: childNodeId, refId: childRefId, value: childValue }]) => {
          const childDataNode = dp.collections.dataNodes.getById(childNodeId);
          if (childRefId) {
            return this.treeNodeProvider.buildNode(
              ValueTDRefNode, childDataNode, this, { key, refId: childRefId, rootDataNode }
            );
          }
          else {
            return this.treeNodeProvider.buildNode(
              ValueTDSimpleNode, childDataNode, this, { key, value: childValue, rootDataNode }
            );
          }
        });
    }
    else {
      // no children on ref node → maybe omitted etc.?
      const simpleValue = dp.collections.values.getById(refId)?.value;
      if (simpleValue !== undefined) {
        return [];
      }
      return [EmptyTreeViewNode.get('(no properties)')];
    }
  }

  canHaveChildren() {
    return true;
  }

  valueRender() {
    const { dp, nodeId } = this;
    const value = dp.util.constructValueFull(nodeId);

    valueRender(value);
    emitValueRenderAction(value, nodeId);
  }
}