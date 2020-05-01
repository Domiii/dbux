import Enum from 'dbux-common/src/util/Enum';

let GraphNodeMode = {
  Collapsed: 1,
  ExpandChildren: 2,
  ExpandSubgraph: 3
};

GraphNodeMode = new Enum(GraphNodeMode);

export default GraphNodeMode;
