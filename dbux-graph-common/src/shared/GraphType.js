import Enum from '@dbux/common/src/util/Enum';

const GraphTypeObj = {
  None: 1,
  SyncGraph: 2,
  AsyncGraph: 3,
  AsyncStack: 4
};

/**
 * @type {(Enum|typeof GraphTypeObj)}
 */
const GraphType = new Enum(GraphTypeObj);
export default GraphType;

const ClassByType = {
  [GraphType.SyncGraph]: 'SyncGraph',
  [GraphType.AsyncGraph]: 'AsyncGraph',
  [GraphType.AsyncStack]: 'AsyncStack',
};

export function getGraphClassByType(graphType) {
  return ClassByType[graphType];
}

const EnabledGraphTypes = new Set([
  // GraphType.None,
  GraphType.SyncGraph,
  GraphType.AsyncGraph,
]);

export function nextGraphType(type) {
  do {
    type = GraphType.nextValue(type);
  }
  while (!EnabledGraphTypes.has(type));
  return type;
}

const DisplayNameByType = {
  // [GraphType.None]: 'Off',
  [GraphType.SyncGraph]: 'Sync',
  [GraphType.AsyncGraph]: 'Async',
};

export function getGraphTypeDisplayName(type) {
  return DisplayNameByType[type];
}