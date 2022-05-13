import DDGEntity from './DDGEntity';

export default class DDGNode extends DDGEntity {
  /**
   * @param {number} entityId 
   * @param {number} dataNodeId
   */
  constructor(entityId, dataNodeId) {
    super(entityId);
    
    this.dataNodeId = dataNodeId;
  }
}
