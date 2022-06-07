import Enum from '../../util/Enum';

/**
 * Some statements/expressions have some high-level (sometimes very domain-specific) purpose.
 * This is a first approach to easily capture, find and reason about traces of such purposes.
 */
let tracePurposeObj = {
  Console: 1,
  /**
   * Generic compute call.
   * → Handled as a standard computation with (maybe multiple) inputs and single output.
   */
  Compute: 10,
  MathMax: 11,
  MathMin: 12,

  /**
   * Callee of function call should be added as input to own DataNode.
   * Similar assumption to Compute: used on BCE with `createBCEOwnDataNode`.
   */
  CalleeInput: 20
};

/**
 * @type {(Enum|typeof tracePurposeObj)}
 */
const TracePurpose = new Enum(tracePurposeObj);


const dataLinkPurposes = new Array(TracePurpose.getValueMaxIndex()).map(() => false);
dataLinkPurposes[TracePurpose.Compute] = true;
dataLinkPurposes[TracePurpose.MathMax] = true;
dataLinkPurposes[TracePurpose.MathMin] = true;
dataLinkPurposes[TracePurpose.CalleeInput] = true;
export function isDataLinkPurpose(purpose) {
  return dataLinkPurposes[purpose];
}

export default TracePurpose;
