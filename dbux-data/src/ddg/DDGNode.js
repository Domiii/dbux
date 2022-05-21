import DDGTimelineNode from './DDGTimelineNodes';
// import DDGTimelineNodeType from './DDGTimelineNodeType';

export default class DDGNode extends DDGTimelineNode {
  ddgNodeId;

  dataNode;
  label;
  
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
  constructor(ddgTimelineNodeType, dataNode, label) {
    super(ddgTimelineNodeType);
    
    this.dataNode = dataNode;
    this.label = label;
  }
}
