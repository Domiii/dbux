import Enum from '@dbux/common/src/util/Enum';

const edgeTypeObj = {
  Write: 1,
  Control: 2,
  Mixed: 3
};

/**
 * @type {(Enum|typeof edgeTypeObj)}
 */
const DDGEdgeType = new Enum(edgeTypeObj);

export default DDGEdgeType;