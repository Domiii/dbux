/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').default } DataNodeType */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').DataNodeTypeValue } DataNodeTypeValue */


// import DDGTimeline from './DDGTimeline';
import first from 'lodash/first';
import last from 'lodash/last';
import pull from 'lodash/pull';
import findLast from 'lodash/findLast';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import DataNodeType, { isDataNodeDelete, isDataNodeModifyType } from '@dbux/common/src/types/constants/DataNodeType';
import RefSnapshot from '@dbux/common/src/types/RefSnapshot';
import { typedShallowClone } from '@dbux/common/src/util/typedClone';
// eslint-disable-next-line max-len
import DDGTimelineNodeType, { isRepeatedRefTimelineNode, isDataTimelineNode, isSnapshotTimelineNode, doesTimelineNodeCarryData, isControlGroupTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import DDGWatchSet from './DDGWatchSet';
import DDGBounds from './DDGBounds';
import DDGEdge, { EdgeState } from './DDGEdge';
import DDGTimelineBuilder from './DDGTimelineBuilder';
// eslint-disable-next-line max-len
import { DDGTimelineNode, ValueTimelineNode, DataTimelineNode, RefSnapshotTimelineNode, RepeatedRefTimelineNode, SnapshotEntryDeleteInfo, DeleteEntryTimelineNode } from './DDGTimelineNodes';
import { DDGRootTimelineId } from './constants';
import ddgQueries, { ddgHostQueries } from './ddgQueries';
import { makeTraceLabel } from '../helpers/makeLabels';
import DDGEdgeType from './DDGEdgeType';

/** @typedef { import("./DDGSet").default } DDGSet */
/** @typedef {import('@dbux/common/src/types/RefSnapshot').ISnapshotChildren} ISnapshotChildren */
/** @typedef { Map.<number, number> } SnapshotMap */

const VerboseAccess = 0;
// const VerboseAccess = 2;

/**
 * NOTE: we generally use {@link import(./SummarizedDDG)} instead of this for rendering etc.
 */
export default class BaseDDG {
  /**
   * @type {string}
   */
  id;

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
   * @type {Object.<number, DataTimelineNode[]>}
   */
  _timelineNodesByDataNodeId;

  VerboseAccess = VerboseAccess;

  /** ########################################
   * render data
   *  ######################################*/

  /**
   * NOTE: {@link DDGTimelineNode#timelineId} indexes this array.
   * @type {DDGTimelineNode[]}
   */
  _timelineNodes;
  /**
   * hackfix: need to fix decisions
   */
  _decisionTimelineNodes;

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
   * @param {DDGSet} ddgSet
   */
  constructor(ddgSet, graphId) {
    this.logger = newLogger('DDG');
    this.ddgSet = ddgSet;
    this.graphId = graphId;
  }

  /** ###########################################################################
   * getters
   * ##########################################################################*/

  get dp() {
    return this.ddgSet.dp;
  }

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

  /**
   * hackfix: remove this once we fixed decisions
   */
  get decisionTimelineNodes() {
    return this._decisionTimelineNodes;
  }

  get timelineNodesByDataNodeId() {
    return this._timelineNodesByDataNodeId;
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
    return this.timelineNodes[DDGRootTimelineId];
  }

  /** ###########################################################################
   * public queries
   * ##########################################################################*/

  getTimelineNode(timelineId) {
    return this._timelineNodes[timelineId];
  }

  doesDataNodeHaveTimelineNode(dataNodeId) {
    return !!this.getTimelineNodesOfDataNode(dataNodeId);
  }

  /**
   * Warning: does NOT include summarized nodes (i.e. !{@link DDGTimelineNode#og})
   * @return {DDGTimelineNode[]?}
   */
  getTimelineNodesOfDataNode(dataNodeId) {
    // return this.timelineNodes
    //   .filter(node => node?.dataNodeId === dataNodeId && (!predicate || predicate(node)));
    return this.timelineNodesByDataNodeId[dataNodeId];
  }

  /** ###########################################################################
   * {@link DataDependencyGraph#build}
   * ##########################################################################*/

  resetBuild() {
    this._refSnapshotsByDataNodeId = [];
    this._lastAccessDataNodeIdByRefId = [];
    this._timelineNodesByDataNodeId = {};

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
  build(watched) {
    // this.selectedSet = inputNodes;
    this._watchSet = new DDGWatchSet(this, watched);
    this._bounds = new DDGBounds(this);
    this._timelineNodes = [null];
    this._decisionTimelineNodes = [null];

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
      this.building = false; // done
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

    if (!isControlGroupTimelineNode(node.type)) {
      const fromEdges = this.inEdgesByTimelineId[node.timelineId] || EmptyArray;
      for (const edgeId of fromEdges) {
        const edge = this.edges[edgeId];
        const { from } = edge;
        const fromNode = this.timelineNodes[from];
        this.#setConnectedDFS(fromNode);
      }
    }
    if (node.children) {
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
      parent.connected = true;
      // if (parent.connected) { // NOTE: don't stop, because if a middle guy is connected, it should still go to the top
      //   // stop propagation
      //   return;
      // }
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
      // register with `WatchSet`
      this.watchSet.maybeAddWatchedNode(newNode);

      // get some extra data we can use
      const dataNode = this.dp.util.getDataNode(newNode.dataNodeId);
      newNode.traceType = this.dp.util.getTraceType(dataNode.traceId);


      // during build, update accessId map
      const accessIdMap = this.timelineBuilder.lastTimelineVarNodeByAccessId;
      if (
        dataNode.accessId && (
          !accessIdMap[dataNode.accessId] ||
          (isDataNodeModifyType(dataNode.type) && accessIdMap[dataNode.accessId].traceId < dataNode.traceId)
        )
      ) {
        VerboseAccess && this.logger.debug(`Register accessId n${dataNode.nodeId}, accessId=${dataNode.accessId}, timelineId=${newNode.timelineId}`);
        // register node by accessId
        accessIdMap[dataNode.accessId] = newNode;
      }
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
      // we only add these during initial build
      let byDataNode = this._timelineNodesByDataNodeId[newNode.dataNodeId];
      if (!byDataNode) {
        this._timelineNodesByDataNodeId[newNode.dataNodeId] = byDataNode = [];
      }
      byDataNode.push(newNode);
    }
  }

  addDeleteEntryNode(dataNode) {
    const { varAccess } = dataNode;
    let deleteLabel;
    if (!varAccess) {
      // should not happen
      deleteLabel = '?';
    }
    else {
      // future-work: this only gives the first name assigned to it, but we might be more interested in "the most recent name" instead
      const varName = this.dp.util.getDataNodeAccessedRefVarName(dataNode.nodeId);
      deleteLabel = `${varName || '?'}[${varAccess.prop}]`;
    }
    const newNode = new DeleteEntryTimelineNode(dataNode.nodeId, deleteLabel);

    this.addDataNode(newNode);

    return newNode;
  }

  getFirstDataTimelineNodeByDataNodeId(dataNodeId) {
    return first(this._timelineNodesByDataNodeId[dataNodeId] || EmptyArray);
  }

  getLastDataTimelineNodeByDataNodeId(dataNodeId, exclude = null) {
    const arr = this._timelineNodesByDataNodeId[dataNodeId] || EmptyArray;
    if (!exclude) {
      return last(arr);
    }
    return findLast(
      arr,
      (n) => n !== exclude
    );
  }

  /** ###########################################################################
   * labels
   * ##########################################################################*/

  /**
   * NOTE: this is a hackfix workaround for partial snapshots,
   * since their `dataNodeId` is a hackfix that points to the "wrong" thing.
   * If you change this, also change {@link BaseDDG#makeSnapshotLabel}!
   */
  getPartialSnapshotTraceId(node) {
    const child0Id = node.children[0];
    if (child0Id) {
      const child0 = this.timelineNodes[child0Id];
      const dataNode = this.dp.util.getDataNode(child0.dataNodeId);
      return dataNode.traceId;
    }
    return null;
  }

  makeSnapshotLabel(refDataNode, partialChildrenDataNodes) {
    if (partialChildrenDataNodes) {
      /**
       * Partial snapshots represent a trace → use that for the label.
       * If you change this, also change {@link BaseDDG#getPartialSnapshotTraceId}!
       */
      const trace = this.dp.util.getTrace(partialChildrenDataNodes[0].traceId);
      const label = makeTraceLabel(trace);
      if (label) {
        return label;
      }
    }
    return this.makeDataNodeLabel(refDataNode);
  }

  makeDataNodeLabel(dataNode) {
    const { dp } = this;
    const { nodeId: dataNodeId, traceId } = dataNode;

    // get trace data
    const { staticTraceId, nodeId: traceNodeId } = this.dp.collections.traces.getById(traceId);
    const isTraceOwnDataNode = traceNodeId === dataNodeId;
    const ownStaticTrace = isTraceOwnDataNode && this.dp.collections.staticTraces.getById(staticTraceId);

    // variable name
    let label = '';
    if (this.watchSet.isReturnDataNode(dataNodeId)) {
      // return label
      label = 'ret';
    }
    else if (dataNode.refId) {
      const varName = dp.util.guessRefVarName(dataNode.nodeId);
      const isNewValue = !!ownStaticTrace?.dataNode?.isNew;
      if (!isNewValue && varName) {
        label = varName;
      }
    }

    if (!label) {
      // NOTE: staticTrace.dataNode.label is used for `Compute` (and some other?) nodes
      label = ownStaticTrace.dataNode?.label;
    }
    if (!label) {
      label = dataNode?.label;
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

  #buildSnapshotChildFromValueRef(valueRef) {
    if (valueRef.refId) {
      // nested un-traced ref
      // NOTE: this could be a built-in or otherwise pre-existing globals (such as console.log)
      //      or was created in a single instruction (e.g. with `JSON.parse`) etc.
      // PROBLEM: the children of nested initial reference values are not addressable
      //      → because they don't have their own DataNode.
      //      → They thus cannot have a unique `accessId`.
      //      → Meaning that their root ValueRef's dataNode is accessed instead of `original`.
      // throw new Error('NYI: nested initial reference types are currently not supported');
      return null;
    }
    else {
      // primitive
      // PROBLEM: this value does not have a unique `dataNode` (but is addressable)
      // TODO: might need some addressing method using its parent (just like `varAccess`)
      // throw new Error('NYI: nested initial primitive value');
      return null;
    }
  }

  /**
   * 
   * @param {RefSnapshotTimelineNode} parentSnapshot 
   * @param {ISnapshotChildren} originalChildren 
   * @param {DataNode[]} modificationDataNodes 
   * @param {boolean} isOriginalValueRef We call this function in two different flavors: with ValueRef.children or with TimelineNode.children
   */
  #addSnapshotChildren(parentSnapshot, originalChildren, modificationDataNodes, isOriginalValueRef, snapshotsByRefId, shallowOnly = false) {
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
      let dataNode = lastModsByProp[prop];
      /**
       * @type {DDGTimelineNode}
       */
      let newChild;
      if (!dataNode) {
        // initial value
        /**
         * @type {RefSnapshot | number | any}
         */
        const original = originalChildren[prop];
        if (isOriginalValueRef) {
          // original is ValueRef
          newChild = this.#buildSnapshotChildFromValueRef(original);
          if (!newChild) {
            continue; // hackfix: ignore for now
          }
        }
        else {
          // original is timelineId
          // NOTE: we are probably not using this anymore
          newChild = this.#deepCloneSnapshot(original, parentSnapshot, snapshotsByRefId);
        }
      }
      else {
        // 1. handle ignore
        if (this.timelineBuilder.shouldIgnoreDataNode(dataNode.nodeId)) {
          // ignore
          continue;
        }

        // 2. handle skip, and try to "adopt" existing node
        const skippedBy = this.timelineBuilder.getSkippedByNode(dataNode);
        const existingNodeOfDataNode = this.getLastDataTimelineNodeByDataNodeId(dataNode.nodeId);
        if (this.building &&
          (newChild = skippedBy || existingNodeOfDataNode) &&
          this.#shouldTimelineNodeBeAdoptedBySnapshot(newChild, parentSnapshot)
        ) {
          // adopt existing node (build mode only)
          // remove from previous group
          const group = this.timelineNodes[newChild.groupId];

          if (group) {
            // hackfix: bruteforce delete
            // Warning: this is currently the only place that makes our graph building super-linear in performance.
            pull(group.children, newChild.timelineId);
            newChild.groupId = 0;
          }

          // update references
          this.#onSnapshotNodeCreated(newChild, snapshotsByRefId, parentSnapshot);
        }
        else {
          // create new child
          if (isDataNodeDelete(dataNode.type)) {
            // delete
            newChild = this.addDeleteEntryNode(dataNode);
            this.#onSnapshotNodeCreated(newChild, snapshotsByRefId, parentSnapshot);
          }
          else {
            if (!shallowOnly && dataNode.refId && this.shouldBuildDeepSnapshotChild(parentSnapshot, dataNode.nodeId)) {
              // → go deep on ref
              newChild = this.addNewRefSnapshot(dataNode, dataNode.refId, snapshotsByRefId, parentSnapshot);
            }
            else {
              // add shallow node
              newChild = this.addValueDataNode(dataNode);
              this.#onSnapshotNodeCreated(newChild, snapshotsByRefId, parentSnapshot);
            }
          }
          if (!existingNodeOfDataNode && skippedBy) {
            // Snapshot captures a skipped DataNode (for the first time).
            //  → add edge to its skippedBy.
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
   * Shallow clone.
   * 
   * @param {*} timelineId
   */
  cloneNode(timelineId) {
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
      throw new Error(`Don't use shallow clone for snapshot nodes. Use #deepCloneSnapshot instead.`);
    }
    else {
      throw new Error(`NYI: cannot clone group or decision nodes - ${DDGTimelineNodeType.nameFrom(originalNode.type)}`);
    }
    return cloned;
  }

  #deepCloneSnapshot(timelineId, snapshotsByRefId, parentSnapshot) {
    const originalNode = this.timelineNodes[timelineId];

    let newNode;
    if (isSnapshotTimelineNode(originalNode.type)) {
      newNode = typedShallowClone(originalNode);
      this.addNode(newNode);
    }
    else {
      newNode = this.cloneNode(timelineId);
    }
    this.#onSnapshotNodeCreated(newNode, snapshotsByRefId, parentSnapshot);

    if (originalNode.children) {
      // → keep cloning
      this.#addSnapshotChildren(newNode, originalNode.children, EmptyArray, false, snapshotsByRefId);
    }
    return newNode;
  }

  /**
   * Check if given node...
   * 1. Is its own root (does not have a parent snapshot)
   * 2. and given `parentSnapshot` is not descendant of that root (checks recursively)
   */
  #isIndependentRootNode(potentialRoot, targetNode) {
    const isRoot = !potentialRoot.parentNodeId;
    if (isRoot && !ddgQueries.isSnapshotDescendant(this, potentialRoot, targetNode)) {
      return true;
    }
    return false;
  }

  /**
   * @param {DataNode} ownDataNode 
   * @param {number} refId The refId of the snapshot. For roots, this is `getDataNodeAccessedRefId`, while for children and certain watched roots, it is {@link DataNode.refId}.
   * @param {SnapshotMap?} snapshotsByRefId If provided, it helps keep track of all snapshots of a set.
   * @param {RefSnapshotTimelineNode?} parentSnapshot
   * @param {DDGTimelineNode[]?} partialChildren Optional: partial children of the snapshot to be rendered.
   * 
   * @return {RefSnapshotTimelineNode}
   */
  addNewRefSnapshot(ownDataNode, refId, snapshotsByRefId, parentSnapshot, partialChildren = null) {
    const { dp } = this;

    if (!refId) {
      throw new Error(`missing refId in dataNode: ${JSON.stringify(ownDataNode, null, 2)}`);
    }

    // handle circular refs (or otherwise repeated refs in set)
    const snapshotId = snapshotsByRefId.get(refId);
    const snapshotOfRef = this.timelineNodes[snapshotId];
    if (snapshotOfRef) {
      // this ref already has a snapshot in set (used during summarization)
      if (snapshotsByRefId.size > 1 && this.#isIndependentRootNode(snapshotOfRef, parentSnapshot)) {
        // NOTE: no need to check, if there is only one root
        // → independent root: we can freely move node from root position to this parent instead
        this.#onSnapshotNodeCreated(snapshotOfRef, snapshotsByRefId, parentSnapshot);
        return snapshotOfRef;
      }

      // if circular or otherwise repeated → add repeater node
      const snapshot = new RepeatedRefTimelineNode(ownDataNode.traceId, ownDataNode.nodeId, refId, snapshotOfRef.timelineId);
      this.addNode(snapshot);
      this.#onSnapshotNodeCreated(snapshot, snapshotsByRefId, parentSnapshot);
      return snapshot;
    }

    /**
     * Create new
     */

    // get modifications on nested refs first
    const fromTraceId = 0;  // → since we are not building upon a previous snapshot, we have to collect everything from scratch
    const rootDataNode = parentSnapshot && ddgHostQueries.getRootDataNode(this, parentSnapshot);
    const toTraceId = rootDataNode?.traceId || ownDataNode.traceId;

    // create snapshot
    const ownTraceId = ownDataNode.traceId; /*TODO: are we really using traceId?*/
    const snapshot = new RefSnapshotTimelineNode(ownTraceId, ownDataNode.nodeId, refId);
    this.addNode(snapshot, snapshotsByRefId);
    this.#onSnapshotNodeCreated(snapshot, snapshotsByRefId, parentSnapshot);
    snapshot.label = this.makeSnapshotLabel(ownDataNode, partialChildren);
    snapshot.isPartial = !!partialChildren;

    /**
     * → build new snapshot, starting from initially recorded valueRef state.
     * NOTE: this is loosely based on {@link dp.util.constructVersionedValueSnapshot}.
     */
    const valueRef = this.dp.collections.values.getById(refId);
    const modificationDataNodes = partialChildren || dp.util.collectDataSnapshotModificationNodes(refId, fromTraceId, toTraceId);
    const originalChildren = partialChildren ? EmptyObject : valueRef.children;
    // Verbose && console.debug(`${snapshot.timelineId} modificationDataNodes ${fromTraceId}→${toTraceId}: ${JSON.stringify(modificationDataNodes.map(n => n.nodeId))}`);
    this.#addSnapshotChildren(
      snapshot,
      originalChildren,
      modificationDataNodes, true, snapshotsByRefId, !!partialChildren);

    // snapshot.hasRefWriteNodes = true;
    this._refSnapshotsByDataNodeId[snapshot.dataNodeId] = snapshot;

    return snapshot;
  }

  /**
   * This is called on any snapshot or snapshot child node.
   * 
   * @param {DDGTimelineNode} newNode 
   * @param {SnapshotMap?} snapshotsByRefId
   * @param {RefSnapshotTimelineNode} parentSnapshot 
   */
  #onSnapshotNodeCreated(newNode, snapshotsByRefId, parentSnapshot) {
    newNode.parentNodeId = parentSnapshot?.timelineId;
    newNode.rootTimelineId = parentSnapshot?.rootTimelineId || newNode.timelineId;

    // update snapshot set
    snapshotsByRefId?.set(newNode.refId, newNode.timelineId);


    if (this.building) {
      // register with `WatchSet`
      this.watchSet.maybeAddWatchedSnapshotNode(newNode);

      // we only add these during initial build
      let byDataNode = this._timelineNodesByDataNodeId[newNode.dataNodeId];
      if (!byDataNode) {
        this._timelineNodesByDataNodeId[newNode.dataNodeId] = byDataNode = [];
      }
      if (last(byDataNode) !== newNode) { // hackfix check: we might have already added them
        byDataNode.push(newNode);
      }

      // add nested edges
      this.timelineBuilder.addNestedSnapshotEdges(newNode);
    }
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

  getEdgeType(fromNode, toNode) {
    return this.getEdgeTypeOfDataNode(fromNode.dataNodeId, toNode.dataNodeId);
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

  /** ###########################################################################
   * heuristics
   * ##########################################################################*/

  /**
   * future-work: can we move this logic to be used when gathering edges, and not so much later?
   * 
   * @param {DDGTimelineNode} toNode
   * @param {DDGTimelineNode} fromNode
   */
  shouldAddEdge(fromNode, toNode) {
    const fromWatched = fromNode.watched;
    const toWatched = toNode.watched;
    if (fromWatched && toWatched &&
      ddgQueries.isSnapshotRoot(this, fromNode) &&
      ddgQueries.isSnapshotRoot(this, toNode)
    ) {
      // don't add edges between watched snapshot ROOTS
      return false;
    }

    return (
      // only link nodes of two snapshots of the same thing if there was a write in between
      !fromNode.rootTimelineId ||

      // TODO: i forgot why we need to check against root, and not just itself
      toNode.dataNodeId > ddgHostQueries.getLastDataNodeIdInRoot(this, fromNode) ||

      // allways allow edges from summary nodes (?)
      !fromNode.og ||

      // hackfix: the final watched snapshot is forced, 
      //    and often shares descendants with previous snapshots who actually contain the Write.
      //    → so we want to allow those edges to come in nevertheless.
      (
        // fromWatched !== toWatched
        toWatched
      )
    );
  }

  /**
   * Whether given snapshot should add deep nodes (or keep it shallow).
   * 
   * Called to check whether
   *  (1) a new node should be added, even though it has been added already or
   *  (2) go deep on new ref node.
   * 
   * @param {RefSnapshotTimelineNode} parentSnapshot 
   */
  shouldBuildDeepSnapshotChild(parentSnapshot, childDataNodeId) {
    // this.logger.debug('deep', parentSnapshot.timelineId, childDataNodeId, this.doesDataNodeHaveOutgoingEdge(childDataNodeId));
    const childDataNode = this.dp.util.getDataNode(childDataNodeId);
    let lastAccessNode;
    return (
      // hackfix
      !this.building ||

      // watched stuff
      (
        parentSnapshot.watched && (                                         // watched snapshot
          this.watchSet.isReturnDataNode(parentSnapshot.dataNodeId) ||      // parent is "return node"
          !this.watchSet.isAddedAndWatchedDataNode(childDataNodeId)         // new node not already watched
        )
      ) ||
      
      // this DataNode is a ref that will be accessed later
      (
        childDataNode.refId &&
        (lastAccessNode = this.dp.indexes.dataNodes.byObjectNodeId.getLast(childDataNode.nodeId)) &&
        lastAccessNode.nodeId > childDataNodeId
      )
    );
  }

  shouldBuildDeepSnapshotRoot(dataNode) {
    if (!dataNode.refId) {
      return false;
    }
    const dataNodeId = dataNode.nodeId;
    let lastAccessNode;
    return (
      // watched
      (
        this.watchSet.isDataNodeInWatchSet(dataNodeId) && (     // watched snapshot
          this.watchSet.isReturnDataNode(dataNodeId) ||         // "return node" snapshot
          !this.watchSet.isAddedAndWatchedDataNode(dataNodeId)  // new node not already watched
        )
      ) ||
      // this DataNode is a ref that will be accessed later
      dataNode.refId &&
      (lastAccessNode = this.dp.indexes.dataNodes.byObjectNodeId.getLast(dataNode.nodeId)) &&
      lastAccessNode.nodeId > dataNode.nodeId
    );
  }

  /**
   * @param {DDGTimelineNode} node 
   */
  #shouldTimelineNodeBeAdoptedBySnapshot(node, parentSnapshot) {
    return (
      // don't adopt watched nodes (unless new parent is also watched)
      (!node.watched || parentSnapshot.watched) &&
      // don't adopt children of other snapshots
      this.#isIndependentRootNode(node, parentSnapshot) &&
      // don't adopt mods for now
      !isDataNodeModifyType(this.dp.util.getDataNode(node.dataNodeId).type) &&
      // don't adopt nodes that already have outgoing dependencies on timeline
      !this.outEdgesByTimelineId[node.timelineId]?.length
    );
  }

  /**
   * In case given DataNode already has a TimelineNode,
   * determine whether it needs a duplicate.
   */
  shouldDuplicateNode(dataNodeId) {
    return (
      this.watchSet.isWatchedDataNode(dataNodeId) && (        // watched
        this.watchSet.isReturnDataNode(dataNodeId) ||         // "return trace"
        !this.watchSet.isAddedAndWatchedDataNode(dataNodeId)  // not already watched
      )
    );
  }

  // doesDataNodeHaveOutgoingEdge(dataNodeId) {
  //   const timelineNodes = this.getTimelineNodesOfDataNode(dataNodeId);
  //   return timelineNodes?.some(n => this.outEdgesByTimelineId[n.timelineId]?.length) || false;
  // }

  /**
   * NOTE: these are very rough heuristics for edge colorization
   */
  getEdgeTypeOfDataNode(fromDataNodeId, toDataNodeId) {
    // TODO: determine correct DDGEdgeType
    let edgeType;
    const fromDataNode = this.dp.util.getDataNode(fromDataNodeId);
    const toDataNode = this.dp.util.getDataNode(toDataNodeId);
    if (
      isDataNodeDelete(fromDataNode.type) ||
      isDataNodeDelete(toDataNode.type)
    ) {
      // TODO: this is not very accurate
      edgeType = DDGEdgeType.Delete;
    }
    else {
      edgeType = DDGEdgeType.Data;
    }
    return edgeType;
  }
}
