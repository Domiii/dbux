import Enum from '../../util/Enum';

/**
 * Some statements/expressions have some high-level (sometimes very domain-specific) purpose.
 * This is a first approach to easily capture, find and reason about traces of such purposes.
 */
let tracePurposeObj = {
  Console: 1
};

/**
 * @type {(Enum|typeof tracePurposeObj)}
 */
const TracePurpose = new Enum(tracePurposeObj);

export default TracePurpose;