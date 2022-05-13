import DDGEntity from './DDGEntity';

/** @typedef {import('./DDGEdgeGroup').default} DDGEdgeGroup */

export default class DDGEdge extends DDGEntity {
  /**
   * @param {*} type 
   * @param {number} id 
   * @param {number} from 
   * @param {number} to 
   * @param {DDGEdgeGroup} group 
   */
  constructor(entityId, type, from, to, group) {
    super(entityId);

    this.type = type;
    this.from = from;
    this.to = to;
    this.group = group;
  }
}
