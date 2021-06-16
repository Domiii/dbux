import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let DataFlowFilterModeType = {
  None: 1,
  ReadOnly: 2,
  WriteOnly: 3
};

DataFlowFilterModeType = new Enum(DataFlowFilterModeType);

export default DataFlowFilterModeType;