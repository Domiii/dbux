import { TreeItem } from 'vscode';
import omit from 'lodash/omit';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import AsyncEventUpdateType, { isPostEventUpdate } from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import { makeTreeItems } from '../../helpers/treeViewHelpers';
import { ContextTDNode, TraceTypeTDNode } from './traceInfoNodes';
import TraceDetailNode from './traceDetailNode';
import EmptyObject from '@dbux/common/src/util/EmptyObject';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */



// ###########################################################################
// Debug
// ###########################################################################

function makeArrayNodes(obj) {
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

  get dp() {
    const {
      applicationId
    } = this.trace;
    const application = allApplications.getApplication(applicationId);
    const { dataProvider: dp } = application;
    return dp;
  }


  mapPostAsyncEvent(postEventUpdate) {
    const {
      // runId: postEventRunId,
      rootId: postEventRootId,
      // realContextId,
      schedulerTraceId,
      // promiseId
    } = postEventUpdate;

    const { dp } = this;

    // if (AsyncEventUpdateType.is.PostAwait) {
    const preEventUpdate = dp.util.getAsyncPreEventUpdateOfTrace(schedulerTraceId);

    if (!preEventUpdate) {
      // should never happen!
      // warn(`[postAwait] "getAsyncPreEventUpdateOfTrace" failed:`, postEventUpdate);
      return {};
    }

    const {
      // runId: preEventRunId,
      // rootId: preEventRootId,
      // contextId: preEventContextId,
      nestedPromiseId
    } = preEventUpdate;

    const nestedUpdate = nestedPromiseId && dp.util.getPreviousPostAsyncEventOfPromise(nestedPromiseId, postEventRootId);
    const { rootId: nestedRootId } = nestedUpdate ?? EmptyObject;

    return {
      nestedRootId
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

    // many PRE events per `rootId`
    const preEventUpdates = asyncEventUpdates?.filter(({ type }) => !isPostEventUpdate(type));

    function evtPrefix(evt) {
      return `${evt.asyncEventId}: [${AsyncEdgeType.nameFromForce(evt.edgeType)}]`;
    }
    const inEvents = dp.indexes.asyncEvents.to.get(rootContextId)
      ?.map(evt => [`${evtPrefix(evt)} <- ${evt.fromRootContextId}`, evt]);
    const outEvents = dp.indexes.asyncEvents.from.get(rootContextId)
      ?.map(evt => [`${evtPrefix(evt)} <- ${evt.toRootContextId}`, evt]);
    const asyncContainerNode = [
      'async',
      {
        AsyncNode: asyncNode,
        PostUpdate: postEventUpdates?.length === 1 ? this.mapPostAsyncEvent(postEventUpdates[0]) : (postEventUpdates || {}),
        ...makeArrayNodes({
          PreUpdates: preEventUpdates,
          InEvents: inEvents,
          OutEvents: outEvents
        })
      },
      {
        description: `thread=${asyncNode?.threadId}, rootId=${rootContextId}`
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
