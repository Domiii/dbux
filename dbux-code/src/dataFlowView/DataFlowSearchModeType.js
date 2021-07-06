import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let DataFlowSearchModeType = {
  ByAccessId: 1,
  ByValueId: 2,
};

DataFlowSearchModeType = new Enum(DataFlowSearchModeType);

export default DataFlowSearchModeType;