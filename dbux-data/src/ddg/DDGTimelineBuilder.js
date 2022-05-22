/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */

import last from 'lodash/last';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import TraceType, { isTraceReturn } from '@dbux/common/src/types/constants/TraceType';
import { isTraceControlRolePush } from '@dbux/common/src/types/constants/TraceControlRole';
import { newLogger } from '@dbux/common/src/log/logger';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
// eslint-disable-next-line max-len
import { DDGTimelineNode, ContextTimelineNode, PrimitiveTimelineNode, DataTimelineNode, TimelineRoot, SnapshotRefTimelineNode } from './DDGTimelineNodes';
import { makeTraceLabel } from '../helpers/makeLabels';

const Verbose = 1;
// const Verbose = 0;



/** ###########################################################################
 * {@link DDGTimelineBuilder}
 *  #########################################################################*/

export default class DDGTimelineBuilder {
  /** ########################################
   * final outputs
   *  ######################################*/
  /**
   * @type {DDGTimelineNode}
   */
  timelineRoot;

  /**
   * NOTE: {@link DDGTimelineNode#timelineId} indexes this array.
   * @type {DDGTimelineNode[]}
   */
  timelineNodes = [null];

  /**
   * NOTE: {@link BaseDataTimelineNode#dataTimelineId} indexes this array.
   * @type {DataTimelineNode[]}
   */
  timelineDataNodes = [null];

  /**
   * @type {DataTimelineNode[]}
   */
  timelineDataNodesByDataNodeId = [];

  /**
   * @type {SnapshotRefTimelineNode[]}
   */
  timelineSnapshotRefNodesByRefId = [];


  /** ########################################
   * build-time datastructures
   *  ######################################*/

  /**
   * @type {DDGTimelineNode[]}
   */
  stack;

  /** ########################################
   * other fields
   *  ######################################*/

  logger;

  /** ########################################
   * ctor
   *  ######################################*/

  /**
   * @param {import('./DataDependencyGraph').default} ddg
   */
  constructor(ddg) {
    this.ddg = ddg;
    this.logger = newLogger('DDGTimelineControlStack');

    const timelineRoot = this.timelineRoot = new TimelineRoot();
    this.#addNode(timelineRoot);

    /**
     * @type {DDGTimelineNode[]}
     */
    this.stack = [timelineRoot];
  }

  /** ###########################################################################
   * getters
   *  #########################################################################*/

  get dp() {
    return this.ddg.dp;
  }

  get root() {
    return this.stack[0];
  }

  peek() {
    return last(this.stack);
  }

  getDataTimelineNodeByDataNodeId(dataNodeId) {
    return this.timelineDataNodesByDataNodeId[dataNodeId];
  }

  getLastTimelineRefSnapshotNode(refId) {
    return this.timelineSnapshotRefNodesByRefId[refId];
  }


  /** ###########################################################################
   * Snapshot mods
   *  #########################################################################*/

  SnapshotMods = {
    /**
     * @param {RuntimeDataProvider} dp
     * @param {IDataSnapshot} snapshot
     * @param {DataNode} modifyNode
     * @param {string} prop
     */
    writeRef(dp, snapshot, modifyNode, prop) {
      snapshot.children[prop] = new RefSnapshot(modifyNode.nodeId, modifyNode.refId, null);
    },

    /**
     * @param {RuntimeDataProvider} dp
     * @param {IDataSnapshot} snapshot
     * @param {DataNode} modifyNode
     * @param {string} prop
     */
    writePrimitive(dp, snapshot, modifyNode, prop) {
      const inputNodeId = modifyNode.inputs[0];
      const inputDataNode = dp.collections.dataNodes.getById(inputNodeId);
      snapshot.children[prop] = this.constructPrimitiveNode(inputDataNode);
    },

    /**
     * @param {RuntimeDataProvider} dp
     * @param {IDataSnapshot} snapshot
     * @param {DataNode} modifyNode
     * @param {string} prop
     */
    deleteProp(dp, snapshot, modifyNode, prop) {
      delete snapshot.children[prop];
    }
  };

  /** ###########################################################################
   * snapshots
   *  #########################################################################*/

  isSnapshotRef(dataNode) {
    let refId;
    return (
      (refId = dataNode.varAccess?.objectNodeId) &&

      // render as Primitive if ValueRef does not have children
      (this.dp.collections.values.getById(refId))?.children
    );
  }

  /**
   * @param {DataNode} ownDataNode 
   * @param {DataNode[]} dataNodes
   * 
   * @return {SnapshotRefTimelineNode}
   */
  constructRefSnapshot(ownDataNode, dataNodes) {
    const { dp } = this;
    // const { nodeId: dataNodeId } = ownDataNode;
    const { refId } = ownDataNode;
    if (!refId) {
      throw new Error(`missing refId`);
    }

    const previousSnapshot = this.getLastTimelineRefSnapshotNode(refId);
    if (!previousSnapshot) {
      /**
       * → build new snapshot.
       * NOTE: this is based on {@link dp.util.constructVersionedValueSnapshot}
       */
      const snapshot = new SnapshotRefTimelineNode(ownDataNode, refId);
      snapshot.label = this.#makeDataNodeLabel(ownDataNode);
      // TODO: dataTimelineId

      const valueRef = this.dp.collections.values.getById(refId);

      // get last modifications by prop
      const fromTraceId = 0;
      const toTraceId = ownDataNode.traceId;
      const modificationDataNodes = dp.util.collectDataSnapshotModificationNodes(snapshot, fromTraceId, toTraceId);
      /**
       * @type {Object.<string, DataNode>}
       */
      const lastModsByProp = {};
      for (const dataNode of modificationDataNodes) {
        lastModsByProp[dataNode.varAccess.prop] = dataNode;
      }

      const allProps = {
        ...Object.keys(lastModsByProp),
        ...Object.keys(valueRef.children)
      };

      // create children
      /**
       * @type {Array | Object}
       */
      snapshot.children = new valueRef.children.constructor();
      for (const prop of allProps) {
        const lastModDataNode = lastModsByProp[prop];
        let newChildSnapshot;
        if (!lastModDataNode) {
          // initial value
          const original = valueRef.children[prop];
          if (original.refId) {
            // nested ref
            // PROBLEM: the children of nested initial reference values are not addressable
            //      → because they cannot have a unique `accessId`!!
            //      → meaning that their root ValueRef's dataNode is accessed instead of `original`.
            throw new Error('NYI: nested initial reference types are currently not supported');
          }
          else {
            // primitive
            // PROBLEM: this node does not have a unique `dataNode` (but is addressable)
            // → should not be a problem
            throw new Error('NYI: nested initial primitive value');
          }
        }
        else {
          // apply lastMod
          if (this.isSnapshotRef(lastModDataNode)) {
            // nested ref
            newChildSnapshot = this.constructRefSnapshot(lastModDataNode, EmptyArray);
          }
          else {
            // primitive
            newChildSnapshot = this.constructPrimitiveDataNode(lastModDataNode);
          }
        }
        snapshot.children.push(newChildSnapshot);
      }
    }
    else {
      /**
       * → deep clone original snapshot, but create new ids for all children.
       */

      // TODO

      // apply `dataNodes` here
      dataNodes && dp.util.applyDataSnapshotModificationsDataNodes(snapshot, dataNodes, this.SnapshotMods);
    }
  }

  /**
   * @param {DataNode} dataNode 
   * @return {PrimitiveTimelineNode}
   */
  constructPrimitiveDataNode(dataNode) {
    const label = this.#makeDataNodeLabel(dataNode);
    return new PrimitiveTimelineNode(dataNode, label);
  }

  /** ###########################################################################
   * create and/or add nodes
   * ##########################################################################*/

  /**
   * NOTE: a trace might induce multiple {@link DDGTimelineNode} in these circumstances:
   *   1. if a DataNode reads or writes an object prop, we add the complete snapshot with all its children
   *   2. a Decision node that is also a Write Node (e.g. `if (x = f())`)
   */
  addTimelineDataNodes(traceId) {
    const { dp } = this;
    const trace = dp.util.getTrace(traceId);
    const dataNodes = dp.util.getDataNodesOfTrace(traceId);
    const ownDataNode = trace.nodeId && dataNodes.find(dataNode => dataNode.nodeId === trace.nodeId);

    if (!ownDataNode) {
      this.logTrace(`NYI: trace did not have own DataNode: "${dp.util.makeTraceInfo(traceId)}"`);
      return;
    }

    if (DataNodeType.is.Write(ownDataNode.type) && dp.util.isTraceControlDecision(traceId)) {
      // TODO: add two nodes in this case
    }

    // create node based on DDGTimelineNodeType
    let newNode;

    // if() {
    //   TODO: add DecisionTimelineNode
    // }
    // else 
    if (this.isSnapshotRef(ownDataNode)) {
      const refNodeId = ownDataNode.varAccess.objectNodeId;
      // ref type access → add Snapshot
      if (dataNodes.some(dataNode => dataNode.varAccess?.objectNodeId !== refNodeId)) {
        // sanity checks
        this.logTrace(`NYI: trace has multiple dataNodes accessing different objectNodeIds - "${dp.util.makeTraceInfo(traceId)}"`);
      }
      newNode = this.constructRefSnapshot(ownDataNode, dataNodes);
    }
    else {
      // primitive value or ref assignment
      // ownDataNode.varAccess.declarationTid;
      if (dataNodes.length > 1) {
        this.logTrace(`NYI: trace has multiple dataNodes but is not ref type (→ rendering first node as primitive) - at trace="${dp.util.makeTraceInfo(traceId)}"`);
      }
      newNode = this.constructPrimitiveDataNode(ownDataNode);
    }

    // add node
    this.#addDataNode(newNode);

    // add to parent
    const parent = this.peek();
    parent.children.push(newNode);
  }

  /**
   * @param {DataTimelineNode} node 
   */
  #addDataNode(node) {
    node.dataTimelineId = this.timelineDataNodes.length;
    this.timelineDataNodes.push(node);
    this.timelineDataNodesByDataNodeId[node.dataNode.nodeId] = node;

    this.#addNode(node);
  }

  /**
   * @param {DDGTimelineNode} node 
   */
  #addNode(node) {
    node.timelineId = this.timelineNodes.length;
    this.timelineNodes.push(node);
  }

  /** ###########################################################################
   * stack util
   * ##########################################################################*/

  #pushGroup(node) {
    this.#addNode(node);
    this.stack.push(node);
  }

  #popGroup() {
    return this.stack.pop();
  }

  /** ###########################################################################
   * {@link DDGTimelineBuilder#visitTrace}
   * ##########################################################################*/

  visitTrace(traceId) {
    const { dp } = this;
    const trace = dp.util.getTrace(traceId);
    const staticTrace = dp.util.getStaticTrace(traceId);
    if (TraceType.is.PushImmediate(staticTrace.type)) {
      // push context
      this.#pushGroup(new ContextTimelineNode(trace.contextId));
    }
    else if (isTraceControlRolePush(staticTrace.controlRole)) {
      // push branch statement
      // TODO
    }
    else if (dp.util.isTraceControlGroupPop(traceId)) {
      // sanity checks
      if (TraceType.is.PopImmediate(staticTrace.type)) {
        // pop context
        const top = this.peek();
        if (trace.contextId !== top.contextId) {
          this.logTrace(`Invalid pop: expected context=${trace.contextId}, but got: ${top.toString()}`);
          return;
        }
      }
      else {
        // pop branch statement
        // TODO
      }
      this.#popGroup();
    }
  }

  /** ###########################################################################
   * labels
   * {@link DDGTimelineBuilder##makeDataNodeLabel}
   * ##########################################################################*/

  #makeDataNodeLabel(dataNode) {
    const { dp } = this;
    const { nodeId: dataNodeId, traceId } = dataNode;

    // get trace data
    const { staticTraceId, nodeId: traceNodeId } = this.dp.collections.traces.getById(traceId);
    const isTraceOwnDataNode = traceNodeId === dataNodeId;
    const ownStaticTrace = isTraceOwnDataNode && this.dp.collections.staticTraces.getById(staticTraceId);
    const isNewValue = !!ownStaticTrace?.dataNode?.isNew;

    // variable name
    let label = '';
    if (dataNode.traceId) {
      // NOTE: staticTrace.dataNode.label is used for `Compute` (and some other?) nodes
      label = ownStaticTrace.dataNode?.label;
    }

    if (!label) {
      const varName = dp.util.getDataNodeDeclarationVarName(dataNodeId);
      if (!isNewValue && varName) {
        label = varName;
      }
      else if (isTraceReturn(ownStaticTrace.type)) {
        // return label
        label = 'ret';
      }
    }

    if (!label) {
      if (dp.util.isTraceOwnDataNode(dataNodeId)) {
        // default trace label
        const trace = dp.util.getTrace(dataNode.traceId);
        label = makeTraceLabel(trace);
      }
      else {
        // TODO: ME
      }
    }
    // else {
    // }

    // TODO: nested DataNodes don't have a traceId (or they don't own it)
    return label;
  }
}
