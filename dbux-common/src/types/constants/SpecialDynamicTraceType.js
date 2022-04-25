import Enum from '../../util/Enum';

/**
 * 
 */
let specialDynamicTraceType = {
  /**
   * It is used to categorize its contexts as a callback of a built-in array higher order function,
   * such as `forEach`, `map`, `find`, `some`, `every` etc.
   * 
   * For these contexts: The first parameter is an individual array entry, and the second its index.
   * (If the function defines these parameters.)
   */
  ArrayHofCall: 1,
};

/**
 * @type {(Enum|typeof specialDynamicTraceType)}
 */
const SpecialDynamicTraceType = new Enum(specialDynamicTraceType);

export default SpecialDynamicTraceType;