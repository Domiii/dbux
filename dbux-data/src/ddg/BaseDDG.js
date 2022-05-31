/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').default } DataNodeType */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').DataNodeTypeValue } DataNodeTypeValue */


// import DDGTimeline from './DDGTimeline';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import { doesTimelineNodeHaveData } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import DDGWatchSet from './DDGWatchSet';
import DDGBounds from './DDGBounds';
import DDGEdge, { EdgeState } from './DDGEdge';
import DDGTimelineBuilder from './DDGTimelineBuilder';
import { DDGTimelineNode, DataTimelineNode } from './DDGTimelineNodes';
import { RootTimelineId } from './constants';

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
   * @type {Obejct.<number, DataTimelineNode>}
   */
  _refSnapshotsByDataNodeId = [];

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
   * Node + Edge getters
   * ##########################################################################*/

  get root() {
    return this.timelineNodes[RootTimelineId];
  }


  /** ###########################################################################
   * {@link DataDependencyGraph#build}
   * ##########################################################################*/

  resetBuild() {
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
