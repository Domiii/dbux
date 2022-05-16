import Enum from '@dbux/common/src/util/Enum';

const LayoutAlgorithmTypeObj = {
  ForceLayout: 1,
  ForceAtlas2: 2,
};

/**
 * @type {(Enum|typeof LayoutAlgorithmTypeObj)}
 */
const LayoutAlgorithmType = new Enum(LayoutAlgorithmTypeObj);
export default LayoutAlgorithmType;
