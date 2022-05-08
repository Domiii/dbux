import Enum from '../../util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let DataNodeType = {
  Write: 1,
  Read: 2,
  Delete: 3,
  Compute: 4
};

/**
 * @type {(Enum)}
 */
DataNodeType = new Enum(DataNodeType);

export default DataNodeType;

const modifyTypes = new Array(DataNodeType.getValueMaxIndex()).map(() => false);
modifyTypes[DataNodeType.Write] = true;
modifyTypes[DataNodeType.Delete] = true;

export function isDataNodeModifyType(dataNodeType) {
  return modifyTypes[dataNodeType];
}