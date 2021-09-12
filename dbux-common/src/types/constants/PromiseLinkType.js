import Enum from '../../util/Enum';

const promiseLinkType = {
  ThenNested: 1,
  AsyncReturn: 2,
  Resolve: 3
};

/**
 * @type {(Enum|typeof promiseLinkType)}
 */
const PromiseLinkType = new Enum(promiseLinkType);

export default PromiseLinkType;
