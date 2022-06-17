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
  CalleeInput: 20,

  /**
   * hackfix: This is added to an input trace that is recorded after its target trace (because instrumentation is hard).
   */
  ReverseInput: 30,
  PatternDefaultValue: 31
};

/**
 * @type {(Enum|typeof tracePurposeObj)}
 */
const TracePurpose = new Enum(tracePurposeObj);


const warnPurposes = new Array(TracePurpose.getValueMaxIndex()).map(() => false);
warnPurposes[TracePurpose.PatternDefaultValue] = true;
export function isWarnPurpose(purpose) {
  return warnPurposes[purpose];
}

export default TracePurpose;
