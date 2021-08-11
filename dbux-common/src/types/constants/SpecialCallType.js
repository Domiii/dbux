import Enum from '../../util/Enum';

/**
 * Allows discerning
 */
let specialCallType = {
  Call: 1,
  Apply: 2,
  Bind: 3,
  /**
   * Result value of a `bind` call.
   * Implies that the caller is a bound function (which is also an "exotic function object").
   */
  Bound: 4
};

/**
 * @type {(Enum|typeof specialCallType)}
 */
const SpecialCallType = new Enum(specialCallType);

export default SpecialCallType;