/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').default } DataNodeType */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').DataNodeTypeValue } DataNodeTypeValue */


// import DDGTimeline from './DDGTimeline';
import last from 'lodash/last';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import DataNodeType, { isDataNodeModifyType } from '@dbux/common/src/types/constants/DataNodeType';
import RefSnapshot from '@dbux/common/src/types/RefSnapshot';
import { typedShallowClone } from '@dbux/common/src/util/typedClone';
// eslint-disable-next-line max-len
import DDGTimelineNodeType, { isRepeatedRefTimelineNode, isDataTimelineNode, isSnapshotTimelineNode, doesTimelineNodeCarryData } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { isTraceReturn } from '@dbux/common/src/types/constants/TraceType';
import { newLogger } from '@dbux/common/src/log/logger';
import DDGWatchSet from './DDGWatchSet';
import DDGBounds from './DDGBounds';
import DDGEdge, { EdgeState } from './DDGEdge';
import DDGTimelineBuilder from './DDGTimelineBuilder';
import { DDGTimelineNode, ContextTimelineNode, ValueTimelineNode, DataTimelineNode, RefSnapshotTimelineNode, RepeatedRefTimelineNode, SnapshotEntryDeleteInfo, DeleteEntryTimelineNode } from './DDGTimelineNodes';
import { RootTimelineId } from './constants';
import ddgQueries from './ddgQueries';
import { makeTraceLabel } from '../helpers/makeLabels';
import DDGEdgeType from './DDGEdgeType';

/** @typedef {import('@dbux/common/src/types/RefSnapshot').ISnapshotChildren} ISnapshotChildren */
/** @typedef { Map.<number, number> } SnapshotMap */

const Verbose = 2;

/**
 * NOTE: we generally use {@link import(./SummarizedDDG)} instead of this for rendering etc.
 */
export default class BaseDDG {
  /**
   * @type {string}
   */
  id;

  /**
   * @type {RuntimeDataProvider}
   */
  dp;

  /**
   * @type {DDGWatchSet}
   */
  _watchSet;

  /**
   * @type {DDGBounds}
   */
  _bounds;

  /**
   * Indexed by `dataNodeId`
   * @type {Array.<RefSnapshotTimelineNode>}
   */
  _refSnapshotsByDataNodeId;

  /**
   * Determines when a given `refId` is accessed the last time.
   * Helps us determine whether a `refId` is used after certain nodes (or whether changes to the ref are internal to a node).
   * 
   * @type {Array.<number>}
   */
  _lastAccessDataNodeIdByRefId;

  /**
   * @type {Obejct.<number, DataTimelineNode>}
   */
  _firstTimelineDataOrSnapshotNodeByDataNodeId;

  /** ########################################
   * render data
   *  ######################################*/

  /**
   * NOTE: {@link DDGTimelineNode#timelineId} indexes this array.
   * @type {DDGTimelineNode[]}
   */
  _timelineNodes;

  /**
   * @type {DDGEdge[]}
   */
  edges;

  /**
   * Maps `timelineId` to array of `edgeId`.
   * @type {Object.<number, number[]>}
   */
  outEdgesByTimelineId;

  /**
   * Maps `timelineId` to array of `edgeId`.
   * @type {Object.<number, number[]>}
   */
  inEdgesByTimelineId;

  /** ########################################
   * other fields
   *  ######################################*/

  logger;

  /** ###########################################################################
   * ctor
   * ##########################################################################*/

  /**
   * 
   * @param {RuntimeDataProvider} dp 
   */
  constructor(dp, graphId) {
    this.logger = newLogger('DDG');
    this.dp = dp;
    this.graphId = graphId;
  }

  /** ###########################################################################
   * getters
   * ##########################################################################*/

  get watchSet() {
    return this._watchSet;
  }

  get bounds() {
    return this._bounds;
  }

  /**
   * 
   */
  get timelineNodes() {
    return this._timelineNodes;
  }


  getRenderData() {
    const {
      timelineNodes,
      edges,
      outEdgesByTimelineId,
      inEdgesByTimelineId
    } = this;
    return {
      timelineNodes,
      edges,
      outEdgesByTimelineId,
      inEdgesByTimelineId
    };
  }

  get root() {
    return this.timelineNodes[RootTimelineId];
  }

  /** ###########################################################################
   * public queries
   * ##########################################################################*/

  getTimelineNode(timelineId) {
    return this._timelineNodes[timelineId];
  }

  /**
   * 
   */
  getTimelineNodesOfDataNode(dataNodeId, predicate = null) {
    // const dataNode = this.getFirstDataTimelineNodeByDataNodeId(dataNodeId);
    // if (dataNode) {
    //   return dataNode;
    // }
    return this.timelineNodes
      .filter(node => node?.dataNodeId === dataNodeId && (!predicate || predicate(node)));
  }

  /** ###########################################################################
   * {@link DataDependencyGraph#build}
   * ##########################################################################*/

  resetBuild() {
    this._refSnapshotsByDataNodeId = [];
    this._lastAccessDataNodeIdByRefId = [];
    this._firstTimelineDataOrSnapshotNodeByDataNodeId = [];

    this.resetEdges();
  }

  resetEdges() {
    this.edges = [null];
    this.inEdgesByTimelineId = {};
    this.outEdgesByTimelineId = {};
  }

  /**
   * @param {number[]} watchTraceIds 
   */
  build(watchTraceIds) {
    // this.selectedSet = inputNodes;
    this._watchSet = new DDGWatchSet(this, watchTraceIds);
    this._bounds = new DDGBounds(this, watchTraceIds);
    this._timelineNodes = [null];

    this.building = true;
    this.resetBuild();

    /** ########################################
     * phase 1: build timeline nodes and edges
     * #######################################*/

    const { bounds } = this;

    try {
      const timelineBuilder = this.timelineBuilder = new DDGTimelineBuilder(this);

      for (let traceId = bounds.minTraceId; traceId <= bounds.maxTraceId; ++traceId) {
        // update control group stack
        timelineBuilder.updateStack(traceId);

        // add nodes and edges of trace
        timelineBuilder.addTraceToTimeline(traceId);
      }


      /** ########################################
       * phase 2: 
       *  1. use edges to gather connectivity data for nodes
       *  2. (and some general post-processing)
       *  ######################################*/

      for (const node of this.timelineNodes) {
        if (!node?.dataNodeId) {
          continue;
        }
        const nIncomingEdges = this.inEdgesByTimelineId[node.timelineId]?.length || 0;
        const nOutgoingEdges = this.outEdgesByTimelineId[node.timelineId]?.length || 0;

        if (this.watchSet.isWatchedDataNode(node.dataNodeId)) {
          this.#setWatchedDFS(node);
        }
        node.nInputs = nIncomingEdges;
        node.nOutputs = nOutgoingEdges;
      }

      /** ########################################
       * phase 3: identify connected nodes
       *  ######################################*/

      for (const node of this.timelineNodes) {
        if (!node?.dataNodeId) {
          continue;
        }
        if (node.watched) {
          this.#setConnectedDFS(node);
        }
      }

      // /** ########################################
      //  * phase 4: connect watched snapshots to its inputs.
      //  * NOTE: this deals especially with the "output"-type watched snapshots.
      //  *    They share nodes with other snapshots, that need extra linkage.
      //  *  ######################################*/

      // for (const watched of this.watchSet.watchedNodes) {
      //   this.#addMissingWatchedEdgesDFS(watched);
      // }
    }
    finally {
      this.building = false; // done
    }
  }

  /**
   * 
   * @param {DataTimelineNode} node 
   */
  #setWatchedDFS(node) {
    node.watched = true;
    this.watchSet.addWatchedNode(node);

    // hackfix: set children of watched snapshots to watched
    if (node.children) {
      for (const childId of Object.values(node.children)) {
        const childNode = this.timelineNodes[childId];
        this.#setWatchedDFS(childNode);
      }
    }
  }

  /**
   * 
   * @param {DataTimelineNode} node 
   */
  #setConnectedDFS(node) {
    if (node.connected) {
      // node already found, stop propagation
      return;
    }

    node.connected = true;

    if (doesTimelineNodeCarryData(node.type)) {
      const fromEdges = this.inEdgesByTimelineId[node.timelineId] || EmptyArray;
      for (const edgeId of fromEdges) {
        const edge = this.edges[edgeId];
        const { from } = edge;
        const fromNode = this.timelineNodes[from];
        this.#setConnectedDFS(fromNode);
      }
    }
    else if (node.children) {
      for (const child of Object.values(node.children)) {
        const childNode = this.timelineNodes[child];
        this.#setConnectedDFS(childNode);
      }
    }
    this.#setConnectedUp(node);
  }

  /**
   * If a child of a snapshot is connected, connect all ancestors
   */
  #setConnectedUp(node) {
    if (node.parentNodeId) {
      const parent = this.timelineNodes[node.parentNodeId];
      if (parent.connected) {
        // stop propagation
        return;
      }
      // this.#setConnectedDFS(parent); // enable this to flood the entire snapshot root
      this.#setConnectedUp(parent);
    }
  }

  /** ###########################################################################
   * nodes
   *  #########################################################################*/

  /**
   * @param {DDGTimelineNode} newNode 
   */
  addNode(newNode) {
    // if (newNode.dataNodeId && this.timelineBuilder.shouldIgnoreDataNode(newNode.dataNodeId)) {
    //   throw new Error(`added ignored node: ${JSON.stringify(newNode)}`);
    // }
    newNode.timelineId = this.timelineNodes.length;
    newNode.og = !!this.building;
    this.timelineNodes.push(newNode);

    if (newNode.dataNodeId && this.building) {
      // hackfix: during build, update accessId map
      const dataNode = this.dp.util.getDataNode(newNode.dataNodeId);
      const accessIdMap = this.timelineBuilder.lastTimelineVarNodeByAccessId;
      if (
        dataNode.accessId && (
          !accessIdMap[dataNode.accessId] ||
          (isDataNodeModifyType(dataNode.type) && accessIdMap[dataNode.accessId].traceId < dataNode.traceId)
        )
      ) {
        // register node by var
        if (dataNode.refId === 100) {
          this.logger.debug(
            `register accessId for v100: n${dataNode.nodeId},`, JSON.stringify(dataNode)
          );
        }
        accessIdMap[dataNode.accessId] = newNode;
      }
    }

    if (this.dp.util.getDataNode(newNode.dataNodeId)?.refId === 100) {
      this.logger.debug(
        `addNode for v100: n${newNode.dataNodeId} (${newNode.timelineId})`
      );
    }
  }

  /**
   * @param {DataNode} dataNode 
   * @return {ValueTimelineNode}
   */
  addValueDataNode(dataNode) {
    const label = this.makeDataNodeLabel(dataNode);
    const newNode = new ValueTimelineNode(dataNode.nodeId, label);

    this.addDataNode(newNode);

    return newNode;
  }

  /**
   * @param {DataTimelineNode} newNode 
   */
  addDataNode(newNode) {
    const { dp } = this;
    this.addNode(newNode);

    // store some relevant data values
    let dataNode = dp.util.getDataNode(newNode.dataNodeId);
    if (dataNode) {
      newNode.varAccess = dataNode.varAccess; // get original varAccess

      while (dataNode?.valueFromId && !dataNode.hasValue) {
        dataNode = dp.util.getDataNode(dataNode.valueFromId);
      }

      // get value from a node that has it
      newNode.value = dataNode.hasValue ? dataNode.value : undefined; //dp.util.getDataNodeValueStringShort(newNode.dataNodeId);
      newNode.refId = dataNode.refId;
    }

    if (this.building) {
      // hackfix: we only need these during initial build
      this._firstTimelineDataOrSnapshotNodeByDataNodeId[newNode.dataNodeId] ||= newNode;
    }
  }

  addDeleteEntryNode(dataNode, prop) {
    const varName = this.dp.util.getDataNodeAccessedRefVarName(dataNode.nodeId);
    const label = `${varName || '?'}[${prop}]`;
    const newNode = new DeleteEntryTimelineNode(dataNode.nodeId, label);

    this.addDataNode(newNode);

    return newNode;
  }

  getFirstDataTimelineNodeByDataNodeId(dataNodeId) {
    return this._firstTimelineDataOrSnapshotNodeByDataNodeId[dataNodeId];
  }

  /** ###########################################################################
   * labels
   * ##########################################################################*/

  makeDataNodeLabel(dataNode) {
    const { dp } = this;
    const { nodeId: dataNodeId, traceId } = dataNode;

    // get trace data
    const { staticTraceId, nodeId: traceNodeId } = this.dp.collections.traces.getById(traceId);
    const isTraceOwnDataNode = traceNodeId === dataNodeId;
    const ownStaticTrace = isTraceOwnDataNode && this.dp.collections.staticTraces.getById(staticTraceId);

    // variable name
    let label = '';
    if (isTraceReturn(ownStaticTrace.type)) {
      // return label
      label = 'ret';
    }
    else if (dataNode.traceId) {
      // NOTE: staticTrace.dataNode.label is used for `Compute` (and some other?) nodes
      label = ownStaticTrace.dataNode?.label;
    }

    if (!label) {
      label = dataNode?.label;
    }
    if (!label) {
      const varName = dataNode.refId && dp.util.getRefVarName(dataNode.refId);
      const isNewValue = !!ownStaticTrace?.dataNode?.isNew;
      if (!isNewValue && varName) {
        label = varName;
      }
    }
    if (!label) {
      if (isTraceOwnDataNode) {
        // default trace label
        const trace = dp.util.getTrace(dataNode.traceId);
        label = makeTraceLabel(trace);
      }
      else {
        // TODO: ME?
      }
    }
    // else {
    // }

    // TODO: nested DataNodes don't have a traceId (or they don't own it)
    return label;
  }

  /** ###########################################################################
   * snapshots
   *  #########################################################################*/

  /**
   * 
   * @param {RefSnapshotTimelineNode} parentSnapshot 
   * @param {ISnapshotChildren} originalChildren 
   * @param {DataNode[]} modificationDataNodes 
   * @param {boolean} isOriginalValueRef We call this function in two different flavors: with ValueRef.children or with TimelineNode.children
   */
  #addSnapshotChildren(parentSnapshot, originalChildren, modificationDataNodes, isOriginalValueRef, snapshotsByRefId) {
    /**
     * @type {Object.<string, DataNode>}
     */
    const lastModsByProp = {};

    for (const dataNode of modificationDataNodes) {
      lastModsByProp[dataNode.varAccess.prop] = dataNode;
    }

    const allProps = new Set([
      ...Object.keys(lastModsByProp),
      ...Object.keys(originalChildren)
    ]);

    // create children
    parentSnapshot.children = new originalChildren.constructor();
    for (const prop of allProps) {
      const lastModDataNode = lastModsByProp[prop];
      /**
       * @type {DDGTimelineNode}
       */
      let newChild;
      if (!lastModDataNode) {
        // initial value
        /**
         * @type {RefSnapshot | number | any}
         */
        const original = originalChildren[prop];
        if (isOriginalValueRef) {
          // original is ValueRef
          if (original.refId) {
            // nested ref
            // PROBLEM: the children of nested initial reference values are not addressable
            //      → because they cannot have a unique `accessId`!!
            //      → meaning that their root ValueRef's dataNode is accessed instead of `original`.
            // throw new Error('NYI: nested initial reference types are currently not supported');
            continue;
          }
          else {
            // NOTE: this happens with commonly used globals (such as console.log)
            // primitive
            // PROBLEM: this value does not have a unique `dataNode` (but is addressable)
            // TODO: might need some addressing method using its parent (just like `varAccess`)
            // throw new Error('NYI: nested initial primitive value');
            continue;
          }
        }
        else {
          // original is timelineId
          newChild = this.deepCloneNode(original, snapshotsByRefId);
          this.#onSnapshotNodeCreated(newChild, parentSnapshot);
        }
      }
      else {
        // handle skip and ignore
        if (this.timelineBuilder.shouldIgnoreDataNode(lastModDataNode.nodeId)) {
          // ignore
          continue;
        }

        if (DataNodeType.is.Delete(lastModDataNode.type)) {
          // parentSnapshot.deleted.push({
          //   prop,
          //   dataNodeId: lastModDataNode
          // });

          // delete
          newChild = this.addDeleteEntryNode(lastModDataNode);
          this.#onSnapshotNodeCreated(newChild, parentSnapshot);
        }
        else {
          const alreadyHadNode = !!this.getFirstDataTimelineNodeByDataNodeId(lastModDataNode.nodeId);

          // apply lastMod
          // if (this.#canBeRefSnapshot(lastModDataNode)) {
          if (lastModDataNode.refId) {
            // nested ref (→ the child's written value is a ref)
            newChild = this.addNewRefSnapshot(lastModDataNode, lastModDataNode.refId, snapshotsByRefId, parentSnapshot);
          }
          else {
            // primitive
            newChild = this.addValueDataNode(lastModDataNode);
            this.#onSnapshotNodeCreated(newChild, parentSnapshot);
          }

          const skippedBy = this.timelineBuilder.getSkippedByDataNode(lastModDataNode);
          if (!alreadyHadNode && skippedBy) {
            // Snapshot picked up a skipped node. Make sure to add edge to its skippedBy.
            this.building && this.addSnapshotEdge(skippedBy, newChild);
          }
        }
      }

      // if (!newChild.timelineId || !newChild.dataNodeId || !this.dp.util.getDataNode(newChild.dataNodeId)) {
      //   // sanity check
      //   throw new Error(`Invalid snapshot child: ${JSON.stringify(newChild)}\n  (in ${JSON.stringify(parentSnapshot)})`);
      // }
      parentSnapshot.children[prop] = newChild.timelineId;
    }
  }

  /**
   * Clone a node of the exact same `dataNodeId`
   * 
   * @param {*} timelineId
   * @param {SnapshotMap?} snapshotsByRefId
   */
  deepCloneNode(timelineId, snapshotsByRefId) {
    const originalNode = this.timelineNodes[timelineId];

    let cloned;
    if (isDataTimelineNode(originalNode.type)) {
      // original was data node (probably primitive)
      cloned = typedShallowClone(originalNode);
      this.addDataNode(cloned);
    }
    else if (isRepeatedRefTimelineNode(originalNode.type)) {
      cloned = typedShallowClone(originalNode);
      this.addNode(cloned);
    }
    else if (isSnapshotTimelineNode(originalNode.type)) {
      cloned = this.#deepCloneSnapshot(timelineId, snapshotsByRefId);
    }
    else {
      throw new Error(`NYI: cannot clone group or decision nodes - ${DDGTimelineNodeType.nameFrom(originalNode.type)}`);
    }
    return cloned;
  }

  #deepCloneSnapshot(timelineId, snapshotsByRefId) {
    const originalNode = this.timelineNodes[timelineId];
    const cloned = typedShallowClone(originalNode);

    // original was nested snapshot
    this.#addRefSnapshotNode(cloned, snapshotsByRefId);

    if (originalNode.children) {
      // → keep cloning
      this.#addSnapshotChildren(cloned, originalNode.children, EmptyArray, false, snapshotsByRefId);
    }
    return cloned;
  }

  /**
   * @param {RefSnapshotTimelineNode} snapshot 
   * @param {SnapshotMap?} snapshotsByRefId
   */
  #addRefSnapshotNode(snapshot, snapshotsByRefId) {
    this.addNode(snapshot);
    snapshotsByRefId?.set(snapshot.refId, snapshot.timelineId);
  }

  /**
   * Check whether `refId` exists in `snapshotsByRefId` as an independent root.
   * To that end:
   * 1. It must exist as a root and
   * 2. Its parent is not a descendant of that root
   */
  #isSnapshotIndependentRoot(snapshot, parentSnapshot) {
    const isRoot = !snapshot.parentNodeId;
    if (isRoot && !ddgQueries.isSnapshotDescendant(this, snapshot, parentSnapshot)) {
      return true;
    }
    return false;
  }

  /**
   * @param {DataNode} ownDataNode 
   * @param {number} refId The refId of the snapshot. For roots, this is `getDataNodeAccessedRefId`, while for children and certain watched roots, it is {@link DataNode.refId}.
   * @param {SnapshotMap?} snapshotsByRefId If provided, it helps keep track of all snapshots of a set.
   * @param {RefSnapshotTimelineNode?} parentSnapshot
   * 
   * @return {RefSnapshotTimelineNode}
   */
  addNewRefSnapshot(ownDataNode, refId, snapshotsByRefId, parentSnapshot) {
    const { dp } = this;

    if (!refId) {
      throw new Error(`missing refId in dataNode: ${JSON.stringify(ownDataNode, null, 2)}`);
    }

    // handle skip and ignore first
    if (this.timelineBuilder.shouldIgnoreDataNode(ownDataNode.nodeId)) {
      this.logger.warn(`Adding snapshot for ignored DataNode n${ownDataNode.nodeId} at "${dp.util.makeTraceInfo(ownDataNode.traceId)}"`);
    }
    const skippedBy = this.timelineBuilder.getSkippedByDataNode(ownDataNode);
    if (skippedBy) {
      ownDataNode = dp.util.getDataNode(skippedBy.dataNodeId);
    }

    // handle circular refs (or otherwise repeated refs in set)
    const snapshotId = snapshotsByRefId.get(refId);
    const snapshotOfRef = this.timelineNodes[snapshotId];
    if (snapshotOfRef) {
      // this ref already has a snapshot in set
      if (snapshotsByRefId.size > 1 && this.#isSnapshotIndependentRoot(snapshotOfRef, parentSnapshot)) {
        // NOTE: no need to check, if there is only one root
        // → independent root: we can freely move node from root position to this parent instead
        return snapshotOfRef;
      }

      // if circular or otherwise repeated → add repeater node
      const snapshot = new RepeatedRefTimelineNode(ownDataNode.traceId, ownDataNode.nodeId, refId, snapshotOfRef.timelineId);
      this.addNode(snapshot);
      this.#onSnapshotNodeCreated(snapshot, parentSnapshot);
      return snapshot;
    }

    // get modifications on nested refs first
    const fromTraceId = 0;  // → since we are not building upon a previous snapshot, we have to collect everything from scratch
    const startDataNode = parentSnapshot?.startDataNodeId && dp.util.getDataNode(parentSnapshot.startDataNodeId);
    const toTraceId = startDataNode?.traceId || ownDataNode.traceId;
    const modificationDataNodes = dp.util.collectDataSnapshotModificationNodes(refId, fromTraceId, toTraceId);

    // future-work: consider first getting the tree of all effective modificationDataNodes.
    //    → at each level, the actual `dataNodeId` would correspond to the max of the entire tree.
    // // determine actual dataNodeId (effective time of snapshot)
    // const realDataNodeId = modificationDataNodes?.length ? 
    //   last(modificationDataNodes).nodeId :
    //   ownDataNode.nodeId;

    // NOTE: we are not taking an early out here, since we don't know about deeper modifications (yet)
    // // existing
    // const existingSnapshot = this._refSnapshotsByDataNodeId[realDataNodeId];
    // if (existingSnapshot) {
    //   // clone existing snapshot
    //   const snapshot = this.deepCloneNode(existingSnapshot.timelineId, snapshotsByRefId);
    //   this.#onSnapshotCreated(snapshot, parentSnapshot);
    //   return snapshot;
    // }

    /**
     * Create new
     */
    const ownTraceId = ownDataNode.traceId; /*TODO: are we really using traceId?*/
    const snapshot = new RefSnapshotTimelineNode(ownTraceId, ownDataNode.nodeId, refId);
    this.#addRefSnapshotNode(snapshot, snapshotsByRefId);
    this.#onSnapshotNodeCreated(snapshot, parentSnapshot);
    snapshot.label = this.makeDataNodeLabel(ownDataNode);


    /**
     * → build new snapshot, starting from initially recorded valueRef state.
     * NOTE: this is loosely based on {@link dp.util.constructVersionedValueSnapshot}.
     */
    const valueRef = this.dp.collections.values.getById(refId);
    // Verbose && console.debug(`${snapshot.timelineId} modificationDataNodes ${fromTraceId}→${toTraceId}: ${JSON.stringify(modificationDataNodes.map(n => n.nodeId))}`);
    this.#addSnapshotChildren(snapshot, valueRef.children, modificationDataNodes, true, snapshotsByRefId);

    // TODO: add refNode edge!

    // }
    // else {
    //   /**
    //    * → deep clone previous snapshot.
    //    */
    //   const fromTraceId = previousSnapshot.traceId;
    //   const toTraceId = ownDataNode.traceId;
    //   const modificationDataNodes = dp.util.collectDataSnapshotModificationNodes(refId, fromTraceId, toTraceId);
    //   // const modificationDataNodes = dataNodesOfTrace;
    //   this.#addSnapshotChildren(snapshot, previousSnapshot.children, modificationDataNodes, false);
    // }

    // snapshot.hasRefWriteNodes = true;
    this._refSnapshotsByDataNodeId[snapshot.dataNodeId] = snapshot;

    return snapshot;
  }

  /**
   * This is called on any snapshot or snapshot child node.
   * 
   * @param {*} newNode 
   * @param {*} parentSnapshot 
   */
  #onSnapshotNodeCreated(newNode, parentSnapshot) {
    // console.debug(`onSnapshotCreated ${parentSnapshot?.timelineId}:${snapshot.timelineId}`);
    newNode.parentNodeId = parentSnapshot?.timelineId;
    // TODO: startDataNodeId is wrong. This way, parent can be smaller than children (but should never be).
    //    → e.g. in ObjectExpression
    newNode.startDataNodeId = parentSnapshot?.startDataNodeId || newNode.dataNodeId;

    if (this.building) {
      // hackfix: we only need these during initial build
      this._firstTimelineDataOrSnapshotNodeByDataNodeId[newNode.dataNodeId] ||= newNode;
    }

    this.building && this.timelineBuilder.onNewSnapshotNode(newNode);
  }

  /** ###########################################################################
   * edges
   * ##########################################################################*/

  // #addEdgeToMap(map, id, edge) {
  //   let edges = map.get(id);
  //   if (!edges) {
  //     map.set(id, edges = []);
  //   }
  //   edges.push(edge);
  // }

  /**
   * @param {DDGEdge} edge 
   */
  #addEdgeToDict(obj, id, edge) {
    let edges = obj[id];
    if (!edges) {
      obj[id] = edges = [];
    }
    edges.push(edge.edgeId);
  }
  /**
   * NOTE: these are very rough heuristics for edge colorization
   */
  getEdgeTypeDataNode(fromDataNodeId, toDataNodeId) {
    // TODO: determine correct DDGEdgeType
    let edgeType;
    const fromDataNode = this.dp.util.getDataNode(fromDataNodeId);
    const toDataNode = this.dp.util.getDataNode(toDataNodeId);
    if (
      DataNodeType.is.Delete(fromDataNode.type) ||
      DataNodeType.is.Delete(toDataNode.type)
    ) {
      edgeType = DDGEdgeType.Delete;
    }
    else {
      edgeType = DDGEdgeType.Data;
    }
    return edgeType;
  }

  getEdgeType(fromNode, toNode) {
    return this.getEdgeTypeDataNode(fromNode.dataNodeId, toNode.dataNodeId);
  }

  shouldAddEdge(fromNode, toNode) {
    const fromWatched = this.watchSet.isWatchedDataNode(toNode.startDataNodeId || toNode.dataNodeId);
    const toWatched = this.watchSet.isWatchedDataNode(fromNode.startDataNodeId || fromNode.dataNodeId);
    if (fromWatched && toWatched &&
      fromNode.startDataNodeId && !fromNode.parentNodeId &&
      toNode.startDataNodeId && !toNode.parentNodeId) {
      // don't add edges between watched snapshot ROOTS
      return false;
    }

    return (
      // only link nodes of two snapshots of the same thing if there was a write in between
      !fromNode.startDataNodeId ||
      toNode.dataNodeId > fromNode.startDataNodeId ||

      // hackfix: the final watched snapshot is forced, 
      //    and often shares descendants with previous snapshots who actually contain the Write.
      (
        fromWatched && !toWatched
      )
    );
  }
  /**
   * @param {DataTimelineNode} fromNode 
   * @param {DataTimelineNode} toNode 
   * @param {EdgeState} edgeState
   */
  addEdge(type, fromTimelineId, toTimelineId, edgeState) {
    const fromNode = this.timelineNodes[fromTimelineId];
    const toNode = this.timelineNodes[toTimelineId];
    if (!this.shouldAddEdge(fromNode, toNode)) {
      return;
    }
    // if (fromNode.dataNodeId === toNode.dataNodeId) {
    //   this.logger.error(`addEdge problem: ${fromNode.label} → ${toNode.label} (fromNode.dataNodeId === toNode.dataNodeId)`);
    // }
    const newEdge = new DDGEdge(type, this.edges.length, fromTimelineId, toTimelineId, edgeState);
    this.edges.push(newEdge);

    this.#addEdgeToDict(this.outEdgesByTimelineId, fromTimelineId, newEdge);
    this.#addEdgeToDict(this.inEdgesByTimelineId, toTimelineId, newEdge);
  }

  /**
   * This is a normal data edge that was added during snapshot construction to one of the
   * snapstho children.
   */
  addSnapshotEdge(fromNode, toNode) {
    const edgeType = this.getEdgeType(fromNode, toNode);
    const edgeState = { nByType: { [edgeType]: 1 } };
    this.addEdge(edgeType, fromNode.timelineId, toNode.timelineId, edgeState);
    // }
  }

}
