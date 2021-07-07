import Enum from '../../util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let asyncEdgeTypeObj = {
  Chain: 1,
  Fork: 2
};

/**
 * @type {(Enum|typeof asyncEdgeTypeObj)}
 */
const AsyncEdgeType = new Enum(asyncEdgeTypeObj);

export default AsyncEdgeType;