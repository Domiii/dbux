/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').default } DataNodeType */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').DataNodeTypeValue } DataNodeTypeValue */


// import DDGTimeline from './DDGTimeline';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import DDGWatchSet from './DDGWatchSet';
import DDGBounds from './DDGBounds';
import DDGEdge, { EdgeState } from './DDGEdge';
import DDGTimelineBuilder from './DDGTimelineBuilder';
import { DataTimelineNode } from './DDGTimelineNodes';
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
  watchSet;

  /**
   * @type {DDGBounds}
   */
  bounds;

  /** ########################################
   * render data
   *  ######################################*/

  /**
   * NOTE: {@link DDGTimelineNode#timelineId} indexes this array.
   * @type {DDGTimelineNode[]}
   */
  timelineNodes;

  /**
   * This is an array of `timelineId`.
   * NOTE: {@link BaseDataTimelineNode#dataTimelineId} indexes this array.
   * @type {number[]}
   */
  timelineDataNodes;

  /**
   * NOTE: 
   * @type {DDGEdge[]}
   */
  edges = [null];

  /**
   * @type {Object.<number, DDGEdge[]>}
   */
  outEdgesByDataTimelineId;

  /**
   * @type {Object.<number, DDGEdge[]>}
   */
  inEdgesByDataTimelineId;


  getRenderData() {
    const {
      timelineNodes,
      timelineDataNodes,
      edges,
      outEdgesByDataTimelineId,
      inEdgesByDataTimelineId
    } = this;
    return {
      timelineNodes,
      timelineDataNodes,
      edges,
      outEdgesByDataTimelineId,
      inEdgesByDataTimelineId
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

  /**
   * @return {DataTimelineNode}
   */
  getDataTimelineNode(dataTimelineId) {
    const timelineId = this.timelineDataNodes[dataTimelineId];
    return this.timelineNodes[timelineId];
  }


  /** ###########################################################################
   * {@link DataDependencyGraph#build}
   * ##########################################################################*/

  _initBuild() {
    this.edges = [null];
    this.inEdgesByDataTimelineId = {};
    this.outEdgesByDataTimelineId = {};
  }

  /**
   * @param {number[]} watchTraceIds 
   */
  build(watchTraceIds) {
    // this.selectedSet = inputNodes;
    this.watchSet = new DDGWatchSet(this, watchTraceIds);
    this.bounds = new DDGBounds(this, watchTraceIds);
    this.timelineNodes = [null];
    this.timelineDataNodes = [null];

    this._initBuild();

    /** ########################################
     * phase 1: build timeline nodes and edges
     * #######################################*/

    const { bounds } = this;
    const timelineBuilder = new DDGTimelineBuilder(this);

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
      const nIncomingEdges = this.inEdgesByDataTimelineId[node.dataTimelineId]?.length || 0;
      const nOutgoingEdges = this.outEdgesByDataTimelineId[node.dataTimelineId]?.length || 0;

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

    if (node.dataTimelineId) {
      const fromEdges = this.inEdgesByDataTimelineId[node.dataTimelineId] || EmptyArray;
      for (const { from } of fromEdges) {
        const fromNode = this.getDataTimelineNode(from);
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
  #addEdgeToDict(obj, id, edge) {
    let edges = obj[id];
    if (!edges) {
      obj[id] = edges = [];
    }
    edges.push(edge);
  }


  /**
   * @param {DataTimelineNode} fromNode 
   * @param {DataTimelineNode} toNode 
   * @param {EdgeState} edgeState
   */
  addEdge(type, fromNodeDataTimelineId, toDataTimelineId, edgeState) {
    const newEdge = new DDGEdge(type, this.edges.length, fromNodeDataTimelineId, toDataTimelineId, edgeState);
    this.edges.push(newEdge);

    this.#addEdgeToDict(this.outEdgesByDataTimelineId, fromNodeDataTimelineId, newEdge);
    this.#addEdgeToDict(this.inEdgesByDataTimelineId, toDataTimelineId, newEdge);
  }
}
