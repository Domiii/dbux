/** @typedef {import('./DDGEdgeGroup').default} DDGEdgeGroup */

export default class DDGEdge {
  /**
   * @param {*} type 
   * @param {number} id 
   * @param {number} from 
   * @param {number} to 
   * @param {DDGEdgeGroup} group 
   */
  constructor(type, id, from, to, group) {
    this.type = type;
    this.id = id;
    this.from = from;
    this.to = to;
    this.group = group;
  }
}
