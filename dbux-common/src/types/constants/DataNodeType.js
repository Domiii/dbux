import Enum from '../../util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let dataNodeTypeObj = {
  Write: 1,
  Read: 2,
  Delete: 3,
  Compute: 4,
  ComputeWrite: 5
};

/**
 * @type {(Enum | typeof dataNodeTypeObj)}
 */
const DataNodeType = new Enum(dataNodeTypeObj);


/** @typedef { typeof dataNodeTypeObj[keyof typeof dataNodeTypeObj] } DataNodeTypeValue */

export default DataNodeType;

const modifyTypes = new Array(DataNodeType.getValueMaxIndex()).map(() => false);
modifyTypes[DataNodeType.Write] = true;
modifyTypes[DataNodeType.ComputeWrite] = true;
modifyTypes[DataNodeType.Delete] = true;

export function isDataNodeModifyType(dataNodeType) {
  return modifyTypes[dataNodeType] || false;
}

const writeTypes = new Array(DataNodeType.getValueMaxIndex()).map(() => false);
writeTypes[DataNodeType.Write] = true;
writeTypes[DataNodeType.ComputeWrite] = true;
export function isDataNodeWrite(dataNodeType) {
  return writeTypes[dataNodeType] || false;
}
