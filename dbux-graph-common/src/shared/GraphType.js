import Enum from '@dbux/common/src/util/Enum';

const GraphTypeObj = {
  SyncGraph: 1,
  AsyncGraph: 2,
  AsyncStack: 3
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