import Enum from '../../util/Enum';

const asyncEventUpdate = {
  AsyncCall: 1,
  PreAwait: 2,
  PostAwait: 3,
  PreThen: 4,
  PostThen: 5,

  // TODO: callback-based asynchronicity
};

/**
 * @type {(Enum|typeof asyncEventUpdate)}
 */
const AsyncEventUpdateType = new Enum(asyncEventUpdate);

const postEventUpdateTypes = new Array(AsyncEventUpdateType.getValueMaxIndex()).map(() => false);
postEventUpdateTypes[AsyncEventUpdateType.PostAwait] = true;
postEventUpdateTypes[AsyncEventUpdateType.PostThen] = true;

export function isPostEventUpdate(type) {
  return postEventUpdateTypes[type];
}

export default AsyncEventUpdateType;
