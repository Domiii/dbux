import Enum from '../../util/Enum';

const promiseLinkType = {
  ThenNested: 1,
  AsyncReturn: 2,
  Resolve: 3,
  Reject: 4,
  PromisifyResolve: 5,
  PromisifiedPromise: 6,
  All: 7,
  AllSettled: 8,
  Race: 9,
  Any: 10
};

/**
 * @type {(Enum|typeof promiseLinkType)}
 */
const PromiseLinkType = new Enum(promiseLinkType);

export default PromiseLinkType;
