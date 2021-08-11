import Enum from '../../util/Enum';

/**
 * 
 */
let specialCallType = {
  Call: 1,
  Apply: 2,
  Bind: 3
};

/**
 * @type {(Enum|typeof specialCallType)}
 */
const SpecialCallType = new Enum(specialCallType);

export default SpecialCallType;