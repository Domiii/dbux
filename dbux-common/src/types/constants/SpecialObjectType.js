import Enum from '../../util/Enum';

/**
 * WARNING: some of these are mapped from `SpecialIdentifierType`
 * {@link TraceCollection#registerValueRefSpecialObjectType}
 */
let specialObjectType = {
  Arguments: 2,
};

/**
 * @type {(Enum|typeof specialObjectType)}
 */
const SpecialObjectType = new Enum(specialObjectType);

export default SpecialObjectType;