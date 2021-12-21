import Enum from '@dbux/common/src/util/Enum';

const SearchModeConfig = {
  None: 1,
  ByTrace: 2,
  ByContext: 3,
  ByValue: 4,
};

/**
 * @type {(Enum|typeof SearchModeConfig)}
 */
const SearchMode = new Enum(SearchModeConfig);

export default SearchMode;