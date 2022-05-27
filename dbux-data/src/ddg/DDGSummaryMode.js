import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let DDGSummaryModeConfig = {
  /**
   * Don't show this node.
   */
  Hide: 1,
  /**
   * Group nodes only.
   * Collapse node and its subgraph to a single node.
   */
  Collapse: 2,
  /**
   * Group nodes only.
   * Expand the node, but only one level deep. Collapse all children.
   */
  ExpandSelf: 3,
  /**
   * Group nodes only.
   * Expand the node and all its descendants.
   */
  ExpandSubgraph: 4,

  /**
   * Root node only.
   */
  HideChildren: 5
};

/**
 * @type {(Enum|typeof DDGSummaryModeConfig)}
 */
const DDGSummaryMode = new Enum(DDGSummaryModeConfig);

/**
 * SummaryModes that are available to root.
 */
export const RootSummaryModes = [
  DDGSummaryModeConfig.ExpandSelf,
  DDGSummaryModeConfig.ExpandSubgraph,
  DDGSummaryModeConfig.HideChildren
];

export default DDGSummaryMode;
