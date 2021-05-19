import Enum from '../../util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let DataNodeType = {
  Binding: 1,
  Write: 2,
  Read: 3,
};

/**
 * @type {(Enum)}
 */
DataNodeType = new Enum(DataNodeType);

export default DataNodeType;