// /** @typedef {import('./DDGEdgeGroup').default} DDGEdgeGroup */

export default class DDGNode {
  /**
   * @param {*} type 
   * @param {number} id 
   * @param {number} from 
   * @param {number} to 
   */
  constructor(type, id, from, to) {
    this.type = type;
    this.id = id;
    this.from = from;
    this.to = to;
  }
}
