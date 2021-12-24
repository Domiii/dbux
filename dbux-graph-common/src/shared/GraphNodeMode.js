import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let GraphNodeModeConfig = {
  Collapsed: 1,
  ExpandChildren: 2,
  ExpandSubgraph: 3
};

/**
 * @type {(Enum|typeof GraphNodeModeConfig)}
 */
const GraphNodeMode = new Enum(GraphNodeModeConfig);

export default GraphNodeMode;
