import Enum from '@dbux/common/src/util/Enum';
import GraphType from './GraphType';

const GraphModeObj = {
  SyncGraph: 1,
  AsyncGraph: 2,
};

/**
 * @type {(Enum|typeof GraphModeObj)}
 */
const GraphMode = new Enum(GraphModeObj);
export default GraphMode;

const EnabledGraphTypesByMode = {
  [GraphMode.SyncGraph]: [GraphType.SyncGraph],
  [GraphMode.AsyncGraph]: [GraphType.AsyncGraph],
};

export function getEnabledGraphTypesByMode(mode) {
  return EnabledGraphTypesByMode[mode];
}
