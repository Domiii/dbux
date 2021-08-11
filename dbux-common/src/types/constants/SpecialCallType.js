import Enum from '../../util/Enum';

/**
 * 
 */
let specialCallType = {
  Call: 1,
  Apply: 2,
  Bind: 3,
  /**
   * Result value of a `bind` call.
   */
  Bound: 4
};

/**
 * @type {(Enum|typeof specialCallType)}
 */
const SpecialCallType = new Enum(specialCallType);

export default SpecialCallType;