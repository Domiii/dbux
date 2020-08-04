import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let GraphNodeMode = {
  Collapsed: 1,
  ExpandChildren: 2,
  ExpandSubgraph: 3
};

GraphNodeMode = new Enum(GraphNodeMode);

export default GraphNodeMode;
