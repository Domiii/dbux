import DDGEntity from './DDGEntity';

export default class DDGNode extends DDGEntity {
  ddgNodeId;
  
  /**
   * Whether node is watched.
   * future-work: compress multiple booleans into a bitmask.
   */
  watched;
  nInputs;
  nOutputs;
  
  /**
   * @param {number} 
   * @param {number} dataNodeId
   * @param {string} label
   */
  constructor(ddgNodeType, dataNodeId, label) {
    super();
    this.type = ddgNodeType;
    this.dataNodeId = dataNodeId;
    this.label = label;
  }
}
