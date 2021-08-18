import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let DataFlowSearchModeType = {
  ByValueId: 1,
  ByAccessId: 2
};

DataFlowSearchModeType = new Enum(DataFlowSearchModeType);

export default DataFlowSearchModeType;