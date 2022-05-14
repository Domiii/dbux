import DDGEntity from './DDGEntity';

export default class DDGEdge extends DDGEntity {
  /**
   * @param {DDGEdgeTypeValue} type 
   * @param {number} from 
   * @param {number} to 
   */
  constructor(type, from, to) {
    super();
    this.type = type;
    this.from = from;
    this.to = to;
  }
}
