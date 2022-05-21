export default class DDGEdge {
  /**
   * @param {DDGEdgeTypeValue} type 
   * @param {number} from 
   * @param {number} to 
   */
  constructor(type, edgeId, from, to) {
    this.type = type;
    this.edgeId = edgeId;
    this.from = from;
    this.to = to;
  }
}
