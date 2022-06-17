import Enum from '../../util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let dataNodeTypeObj = {
  Write: 1,
  Read: 2,
  Delete: 3,
  Compute: 4,

  // some special types:

  /**
   * Used for `UpdateExpression`.
   */
  ComputeWrite: 5,

  /**
   * Used for `pop`.
   */
  ReadAndDelete: 6
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
modifyTypes[DataNodeType.ReadAndDelete] = true;
export function isDataNodeModifyType(dataNodeType) {
  return modifyTypes[dataNodeType] || false;
}

const modifyOrComputeTypes = [...modifyTypes];
modifyOrComputeTypes[DataNodeType.Compute] = true;

export function isDataNodeModifyOrComputeType(dataNodeType) {
  return modifyOrComputeTypes[dataNodeType] || false;
}

const writeTypes = new Array(DataNodeType.getValueMaxIndex()).map(() => false);
writeTypes[DataNodeType.Write] = true;
writeTypes[DataNodeType.ComputeWrite] = true;
export function isDataNodeWrite(dataNodeType) {
  return writeTypes[dataNodeType] || false;
}


const deleteTypes = new Array(DataNodeType.getValueMaxIndex()).map(() => false);
deleteTypes[DataNodeType.Delete] = true;
deleteTypes[DataNodeType.ReadAndDelete] = true;
export function isDataNodeDelete(dataNodeType) {
  return deleteTypes[dataNodeType] || false;
}

const readTypes = new Array(DataNodeType.getValueMaxIndex()).map(() => false);
readTypes[DataNodeType.Read] = true;
readTypes[DataNodeType.ReadAndDelete] = true;
export function isDataNodeRead(dataNodeType) {
  return readTypes[dataNodeType] || false;
}
