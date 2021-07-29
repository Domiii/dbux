import Enum from '../../util/Enum';

const asyncEventUpdate = {
  PreAwait: 1,
  PostAwait: 2,
  PreThen: 3,
  PostThen: 4,
  PreCallback: 5,
  PostCallback: 6
};

/**
 * @type {(Enum|typeof asyncEventUpdate)}
 */
const AsyncEventUpdateType = new Enum(asyncEventUpdate);

const postEventUpdateTypes = new Array(AsyncEventUpdateType.getValueMaxIndex()).map(() => false);
postEventUpdateTypes[AsyncEventUpdateType.PostAwait] = true;
postEventUpdateTypes[AsyncEventUpdateType.PostThen] = true;
postEventUpdateTypes[AsyncEventUpdateType.PostCallback] = true;

/**
 * PRE updates initialize scheduling of an asynchronous event. They just collect relevant information for later.
 * POST updates happen *after* the event. POST updates insert an event edge.
 */
export function isPostEventUpdate(type) {
  return postEventUpdateTypes[type];
}


const awaitEventTypes = new Array(AsyncEventUpdateType.getValueMaxIndex()).map(() => false);
awaitEventTypes[AsyncEventUpdateType.PreAwait] = true;
awaitEventTypes[AsyncEventUpdateType.PostAwait] = true;

export function isAwaitEvent(type) {
  return awaitEventTypes[type];
}

export default AsyncEventUpdateType;
