export default class DDGEdge {
  /**
   * @param {DDGEdgeTypeValue} type 
   * @param {number} from → `dataTimelineId`
   * @param {number} to → `dataTimelineId`
   */
  constructor(type, edgeId, from, to) {
    this.type = type;
    this.edgeId = edgeId;
    this.from = from;
    this.to = to;
  }
}
