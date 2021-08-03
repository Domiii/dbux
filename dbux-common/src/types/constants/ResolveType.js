import Enum from '../../util/Enum';

const resolveType = {
  Resolve: 1,
  Reject: 2
};

/**
 * @type {(Enum|typeof resolveType)}
 */
const ResolveType = new Enum(resolveType);

export default ResolveType;
