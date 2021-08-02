import omit from 'lodash/omit';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import AsyncEventUpdateType, { isPostEventUpdate } from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import { makeTreeItem, makeTreeItems } from '../../helpers/treeViewHelpers';
import { ContextTDNode, TraceTypeTDNode } from './traceInfoNodes';
import TraceDetailNode from './traceDetailNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */



// ###########################################################################
// Debug
// ###########################################################################

function makeObjectArrayNodes(obj) {
  return Object.fromEntries(
    Object.entries(obj)
      .map(([name, arr]) => [`${name} (${arr?.length || 0})`, arr || {}])
  );
}

export class DebugTDNode extends TraceDetailNode {
  static makeLabel(/* trace, parent */) {
    return 'Debug';
  }

  get collapseChangeUserActionType() {
    return UserActionType.TDDebugUse;
  }

  init() {
    this.description = `id: ${this.trace.traceId}`;
  }


  mapPostAsyncEvent = (postEventUpdate) => {
    return {
      ...postEventUpdate,
      ...this.dp.util.getPostEventUpdateData(postEventUpdate)
    };
  }

  // makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }

  buildChildren() {
    const { trace, dp } = this;

    const {
      traceId,
      nodeId,
      contextId,
      rootContextId,
      // runId,
      staticTraceId,
      ...otherTraceProps
    } = trace;

    const context = dp.collections.executionContexts.getById(contextId);
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const { staticContextId } = context;
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    const dataTraceId = dp.util.getValueTrace(traceId)?.traceId || traceId;

    // ###########################################################################
    // dataNodes
    // ###########################################################################
    const dataNodes = dp.util.getDataNodesOfTrace(dataTraceId);

    let dataNode;
    if (nodeId) {
      dataNode = dp.collections.dataNodes.getById(nodeId);
    }
    else {
      dataNode = dataNodes?.[0];
    }

    const dataNodeLabel = dataNode ? `dataNodes[${dataNodes?.indexOf(dataNode)}]` : `dataNodes: []`;
    const dataNodeCount = dataNodes?.length || 0;

    const allDataNodes = [];
    dataNodeCount > 0 && allDataNodes.push([dataNodeLabel, dataNode, { description: `nodeId=${dataNode.nodeId}, valueId=${dataNode.valueId}, accessId=${dataNode.accessId}` }]);
    dataNodeCount > 1 && allDataNodes.push([`all dataNodes (${dataNodeCount})`, dataNodes]);

    // ###########################################################################
    // valueRef
    // ###########################################################################

    // const refId = dataNode?.refId;
    const valueRef = dp.util.getTraceValueRef(dataTraceId);
    const valueNode = [
      'valueRef',
      valueRef,
      {
        description: `refId=${valueRef?.refId || 0}`
      }
    ];
    // const promiseData = dataProvider.collections.promises.getById(context.promiseId);
    // const promiseNode = [
    //   'promise', 
    //   promiseData,
    //   { 
    //     description: (promiseData?.valueId + '') || 0
    //   }
    // ];

    // ###########################################################################
    // async
    // ###########################################################################

    const asyncNode = dp.indexes.asyncNodes.byRoot.getFirst(rootContextId);
    const asyncEventUpdates = dp.indexes.asyncEventUpdates.byRoot.get(rootContextId);

    // one POST event per `rootId`
    const postEventUpdates = asyncEventUpdates?.filter(({ type }) => isPostEventUpdate(type));
    const postEventUpdateData = postEventUpdates?.map(this.mapPostAsyncEvent);

    // many PRE events per `rootId`
    const preEventUpdates = asyncEventUpdates?.filter(({ type }) => !isPostEventUpdate(type));

    const asyncContainerNode = [
      'Async',
      {
        AsyncNode: asyncNode,
        PostEventUpdateData: makeTreeItem(
          'PostEventUpdateData',
          postEventUpdateData?.length === 1 ? postEventUpdateData[0] : (postEventUpdateData || {}),
          { description: `${postEventUpdateData?.map(upd => AsyncEventUpdateType.nameFrom(upd.type)) || ''}` }
        ),
        ...makeObjectArrayNodes({
          PreUpdates: preEventUpdates
        }),
      },
      {
        // eslint-disable-next-line max-len
        description: `thread=${asyncNode?.threadId}, root=${rootContextId}${postEventUpdateData?.map(upd => ` (${AsyncEventUpdateType.nameFrom(upd.type)})`) || ''}`
      }
    ];


    // ###########################################################################
    // final result
    // ###########################################################################

    const children = [
      ...this.treeNodeProvider.buildDetailNodes(this.trace, this, [
        TraceTypeTDNode,
        ContextTDNode,
      ]),
      ...makeTreeItems(
        ['trace', otherTraceProps],
        valueNode,
        ...allDataNodes,
        [`context`, context],
        asyncContainerNode,
        // ['staticTrace', omit(staticTrace, 'loc')],
        ['staticTrace', staticTrace],
        ['staticContext', omit(staticContext, 'loc')],
        // promiseNode
      )
    ];

    return children;
  }
}
