import Enum from '../../util/Enum';

const promiseLinkType = {
  ThenNested: 1,
  AsyncReturn: 2,
  Resolve: 3,
  Reject: 4,
  All: 5,
  Promisify: 6,
  Race: 7
};

/**
 * @type {(Enum|typeof promiseLinkType)}
 */
const PromiseLinkType = new Enum(promiseLinkType);

export default PromiseLinkType;
