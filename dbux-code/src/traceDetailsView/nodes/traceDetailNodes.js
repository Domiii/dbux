import AsyncTDNode from './AsyncTDNodes';
import { DebugTDNode } from './DebugTDNode';
import ExecutionsTDNode from './ExecutionsTDNodes';
import { makeResearchNodes } from './research';
// import StaticContextTDNode from './StaticContextTDNodes';
// import TrackObjectTDNode from './TrackObjectTDNodes';
import ValueTDRefNode from './ValueTDRefNode';
import ValueTDSimpleNode from './ValueTDSimpleNode';
// import NearbyValuesTDNode from './NearbyValuesTDNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

// ###########################################################################
// DetailNodeClasses
// ###########################################################################

export const DetailNodeClasses = [
  ValueTDRefNode,
  ValueTDSimpleNode,
  // TrackObjectTDNode,
  ExecutionsTDNode,
  // DataNodeTDNode,
  // NearbyValuesTDNode,
  // StaticContextTDNode,
  // InfoTDNode,
  AsyncTDNode,
  DebugTDNode,
  
  ...makeResearchNodes()
];