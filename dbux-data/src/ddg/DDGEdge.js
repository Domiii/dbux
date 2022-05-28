

/**
 * NOTE: used while building the graph
 */
export class EdgeState {
  nByType = {};
}

export default class DDGEdge {
  /**
   * The amount of edges merged into this edge.
   * Used as a thickness measure.
   * @type {Object.<number, number>}
   */
  nByType;

  /**
   * @param {DDGEdgeTypeValue} type 
   * @param {number} from → `dataTimelineId`
   * @param {number} to → `dataTimelineId`
   */
  constructor(type, edgeId, from, to, nByType) {
    this.type = type;
    this.edgeId = edgeId;
    this.from = from;
    this.to = to;
    this.nByType = nByType;
  }
}
