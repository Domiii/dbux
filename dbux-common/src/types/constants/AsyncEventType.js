import Enum from '../../util/Enum';
import AsyncEventUpdateType from './AsyncEventUpdateType';

/**
 * NOTE: This is just a summary type for {@link AsyncEventUpdateType}.
 * For most intents and purposes, you want {@link AsyncEventUpdateType} instead.
 * (Currently only used by analysis "plugins".)
 */
const asyncEventTypeObj = {
  None: 0,
  Await: 1,
  Then: 2,
  Callback: 3,
};

/**
 * @type {(Enum|typeof asyncEventUpdate)}
 */
const AsyncEventType = new Enum(asyncEventTypeObj);

const typeMap = {
  [AsyncEventUpdateType.PostAwait]: AsyncEventType.Await,
  [AsyncEventUpdateType.PostThen]: AsyncEventType.Then,
  [AsyncEventUpdateType.PostCallback]: AsyncEventType.Callback,
};
export function getAsyncEventTypeOfAsyncEventUpdateType(updateType) {
  return typeMap[updateType] || AsyncEventType.None;
}

export default AsyncEventType;
