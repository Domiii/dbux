import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import ProgramDependencyGraph from '@dbux/data/src/pdg/ProgramDependencyGraph';
import traceSelection from '@dbux/data/src/traceSelection';
import makeTreeItem, { makeTreeItems, objectToTreeItems } from '../helpers/makeTreeItem';

export function selectDataNodeOrTrace(dp, traceId, dataNodeId) {
  const dataNode = dataNodeId && dp.util.getDataNode(dataNodeId);
  if (!traceId) {
    ({ traceId } = dataNode);
  }
  if (traceId) {
    const trace = dp.collections.traces.getById(traceId);
    traceSelection.selectTrace(trace, null, dataNodeId);
  }
}

export function makeDataNodeLabel(dp, dataNodeId) {
  return dp.util.getDataNodeValueStringShort(dataNodeId);
}

export function makeDataNodeDescription(dp, dataNodeId) {
  const dataNode = dp.util.getDataNode(dataNodeId);
  return `${dataNodeId} ${DataNodeType.nameFrom(dataNode.type)} (ref=${dataNode.refId}, v=${dataNode.value})`;
}

/**
 * @param {ProgramDependencyGraph} pdg
 */
export function renderDataNode(
  dp, dataNodeId,
  children,
  label = makeDataNodeLabel(dp, dataNodeId)
) {
  if (!children) {
    children = dp.util.getDataNode(dataNodeId);
  }
  // render inputs and make them clickable
  if (children?.inputs) {
    children = { ...children };
    children.inputs = children.inputs.map(nodeId => {
      return makeTreeItem(
        makeDataNodeDescription(dp, nodeId),
        null,
        {
          handleClick() {
            const node = dp.util.getDataNode(nodeId);
            node && selectDataNodeOrTrace(dp, node.traceId, nodeId);
          }
        }
      );
    });
  }
  return makeTreeItem(
    label,
    children,
    {
      description: makeDataNodeDescription(dp, dataNodeId)
    }
  );
}
