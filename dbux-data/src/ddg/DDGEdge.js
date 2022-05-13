import DDGEntity from './DDGEntity';

/** @typedef {import('./DDGEdgeGroup').default} DDGEdgeGroup */

export default class DDGEdge extends DDGEntity {
  /**
   * @param {DDGEdgeType} type 
   * @param {number} id 
   * @param {number} from 
   * @param {number} to 
   * @param {DDGEdgeGroup} group 
   */
  constructor(type, from, to, group) {
    super();
    this.type = type;
    this.from = from;
    this.to = to;
    this.group = group;
  }
}
