import DDGEntity from './DDGEntity';

export default class DDGNode extends DDGEntity {
  /**
   * @param {number} entityId 
   * @param {number} dataNodeId
   */
  constructor(dataNodeId) {
    super();
    this.dataNodeId = dataNodeId;
  }
}
