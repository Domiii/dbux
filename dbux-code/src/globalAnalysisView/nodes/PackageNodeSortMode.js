import Enum from '@dbux/common/src/util/Enum';

const PackageNodeSortModeObj = {
  ByCreatedAt: 1,
  ByName: 2
};

/**
 * @type {(Enum|typeof PackageNodeSortModeObj)}
 */
const PackageNodeSortMode = new Enum(PackageNodeSortModeObj);

export default PackageNodeSortMode;
