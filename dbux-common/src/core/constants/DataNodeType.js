import Enum from '../../util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let DataNodeType = {
  Write: 1,
  Read: 2,
};

/**
 * @type {(Enum)}
 */
DataNodeType = new Enum(DataNodeType);

export default DataNodeType;