import Enum from '@dbux/common/src/util/Enum';

const edgeTypeObj = {
  /**
   * Data movement edge
   */
  Data: 1,
  /**
   * Control edge
   */
  Control: 2,
  Mixed: 3,
  Delete: 4
};

/**
 * @type {(Enum|typeof edgeTypeObj)}
 */
const DDGEdgeType = new Enum(edgeTypeObj);

export default DDGEdgeType;