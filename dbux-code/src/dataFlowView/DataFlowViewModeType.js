import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let DataFlowViewModeType = {
  ByAccessId: 1,
  ByValueId: 2,
};

DataFlowViewModeType = new Enum(DataFlowViewModeType);

export default DataFlowViewModeType;