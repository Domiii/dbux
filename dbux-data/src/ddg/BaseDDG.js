/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').default } DataNodeType */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').DataNodeTypeValue } DataNodeTypeValue */


// import DDGTimeline from './DDGTimeline';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import RefSnapshot from '@dbux/common/src/types/RefSnapshot';
import { typedShallowClone } from '@dbux/common/src/util/typedClone';
// eslint-disable-next-line max-len
import DDGTimelineNodeType, { isRepeatedRefTimelineNode, isDataTimelineNode, isSnapshotTimelineNode, doesTimelineNodeHaveData } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { isTraceReturn } from '@dbux/common/src/types/constants/TraceType';
import DDGWatchSet from './DDGWatchSet';
import DDGBounds from './DDGBounds';
import DDGEdge, { EdgeState } from './DDGEdge';
import DDGTimelineBuilder from './DDGTimelineBuilder';
import { DDGTimelineNode, ContextTimelineNode, ValueTimelineNode, DataTimelineNode, RefSnapshotTimelineNode, RepeatedRefTimelineNode } from './DDGTimelineNodes';
import { RootTimelineId } from './constants';
import ddgQueries from './ddgQueries';
import { makeTraceLabel } from '../helpers/makeLabels';

/** @typedef {import('@dbux/common/src/types/RefSnapshot').ISnapshotChildren} ISnapshotChildren */
/** @typedef { Map.<number, number> } SnapshotMap */

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
  _firstTimelineDataNodeByDataNodeId;

  /** ########################################
   * render data
   *  ######################################*/

  /**
   * NOTE: {@link DDGTimelineNode#timelineId} indexes this array.
   * @type {DDGTimelineNode[]}
   */
  _timelineNodes;

  /**
   * NOTE: 
   * @type {DDGEdge[]}
   */
  edges;

  /**
   * @type {Object.<number, DDGEdge[]>}
   */
  outEdgesByTimelineId;

  /**
   * @type {Object.<number, DDGEdge[]>}
   */
  inEdgesByTimelineId;

  /** ###########################################################################
   * ctor
   * ##########################################################################*/

  /**
   * 
   * @param {RuntimeDataProvider} dp 
   */
  constructor(dp, graphId) {
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

  getTimelineNode(timelineId) {
    return this._timelineNodes[timelineId];
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
   * {@link DataDependencyGraph#build}
   * ##########################################################################*/

  resetBuild() {
    this._refSnapshotsByDataNodeId = [];
    this._lastAccessDataNodeIdByRefId = [];
    this._firstTimelineDataNodeByDataNodeId = [];

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
    }
    finally {
      this.timelineBuilder = null; // done
    }
  }

  /**
   * 
   * @param {DataTimelineNode} node 
   */
  #setWatchedDFS(node) {
    node.watched = true;

    // hackfix: set children of watched snapshots to watched
    if (node.children) {
      for (const childId of node.children) {
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

    if (doesTimelineNodeHaveData(node.type)) {
      const fromEdges = this.inEdgesByTimelineId[node.timelineId] || EmptyArray;
      for (const edgeId of fromEdges) {
        const edge = this.edges[edgeId];
        const { from } = edge;
        const fromNode = this.timelineNodes[from];
        this.#setConnectedDFS(fromNode);
      }
    }
    else if (node.children) {
      // TODO: other types of children (decisions, ref etc.)
      for (const child of Object.values(node.children)) {
        const childNode = this.timelineNodes[child];
        this.#setConnectedDFS(childNode);
      }
    }
  }

  /** ###########################################################################
   * nodes
   *  #########################################################################*/

  /**
   * @param {DDGTimelineNode} newNode 
   */
  addNode(newNode) {
    newNode.timelineId = this.timelineNodes.length;
    this.timelineNodes.push(newNode);
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
    this._firstTimelineDataNodeByDataNodeId[newNode.dataNodeId] ||= newNode;
    // newNode.hasRefNodes = !!dp.util.getDataNodeModifyingRefId(newNode.dataNodeId);
  }

  getFirstDataTimelineNodeByDataNodeId(dataNodeId) {
    return this._firstTimelineDataNodeByDataNodeId[dataNodeId];
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

    const allProps = [
      ...Object.keys(lastModsByProp),
      ...Object.keys(originalChildren)
    ];

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
            return;
          }
          else {
            // NOTE: this happens with commonly used globals (such as console.log)
            // primitive
            // PROBLEM: this value does not have a unique `dataNode` (but is addressable)
            // TODO: might need some addressing method using its parent (just like `varAccess`)
            // throw new Error('NYI: nested initial primitive value');
            return;
          }
        }
        else {
          // original is timelineId
          newChild = this.#deepCloneNode(original, snapshotsByRefId);
        }
      }
      else {
        // apply lastMod
        // if (this.#canBeRefSnapshot(lastModDataNode)) {
        if (lastModDataNode.refId) {
          // nested ref (→ the child's written value is a ref)
          newChild = this.addNewRefSnapshot(lastModDataNode, lastModDataNode.refId, snapshotsByRefId, parentSnapshot);
        }
        else {
          // primitive
          newChild = this.addValueDataNode(lastModDataNode);
          this.timelineBuilder?.onNewDataTimelineNode(newChild);
        }
      }
      newChild.parentNodeId = parentSnapshot.timelineId;
      parentSnapshot.children[prop] = newChild.timelineId;
    }
  }

  /**
   * Clone a node of the exact same `dataNodeId`
   * 
   * @param {*} timelineId
   * @param {SnapshotMap?} snapshotsByRefId
   */
  #deepCloneNode(timelineId, snapshotsByRefId) {
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
      return new RepeatedRefTimelineNode(ownDataNode.traceId, ownDataNode.nodeId, refId, snapshotOfRef.timelineId);
    }

    const existingSnapshot = this._refSnapshotsByDataNodeId[ownDataNode.nodeId];
    if (existingSnapshot) {
      // clone existing snapshot
      return this.#deepCloneNode(existingSnapshot.timelineId, snapshotsByRefId);
    }

    /**
     * Create new
     */
    const snapshot = new RefSnapshotTimelineNode(ownDataNode.traceId, ownDataNode.nodeId, refId);
    snapshot.label = this.makeDataNodeLabel(ownDataNode);
    this.#addRefSnapshotNode(snapshot, snapshotsByRefId);

    /**
     * → build new snapshot.
     * NOTE: this is loosely based on {@link dp.util.constructVersionedValueSnapshot}.
     */
    const valueRef = this.dp.collections.values.getById(refId);

    // get last modifications by prop
    const fromTraceId = 0;  // → since we are not building upon a previous snapshot, we have to collect everything from scratch
    const toTraceId = ownDataNode.traceId;
    const modificationDataNodes = dp.util.collectDataSnapshotModificationNodes(refId, fromTraceId, toTraceId);
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
   * @param {DataTimelineNode} fromNode 
   * @param {DataTimelineNode} toNode 
   * @param {EdgeState} edgeState
   */
  addEdge(type, fromTimelineId, toTimelineId, edgeState) {
    const newEdge = new DDGEdge(type, this.edges.length, fromTimelineId, toTimelineId, edgeState);
    this.edges.push(newEdge);

    this.#addEdgeToDict(this.outEdgesByTimelineId, fromTimelineId, newEdge);
    this.#addEdgeToDict(this.inEdgesByTimelineId, toTimelineId, newEdge);
  }
}
