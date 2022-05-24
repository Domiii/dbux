export default class DDGEdge {
  /**
   * The amount of edges merged into this edge.
   * Used as a thickness measure.
   * @type {number}
   */
  n;

  /**
   * @param {DDGEdgeTypeValue} type 
   * @param {number} from → `dataTimelineId`
   * @param {number} to → `dataTimelineId`
   */
  constructor(type, edgeId, from, to, n) {
    this.type = type;
    this.edgeId = edgeId;
    this.from = from;
    this.to = to;
    this.n = n;
  }
}
