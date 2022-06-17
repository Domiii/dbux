import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { renderValueSimple } from '@dbux/common/src/util/stringUtil';
import { parsePackageName } from '@dbux/common-node/src/util/moduleUtil';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import AsyncEventUpdateType, { isPostEventUpdate } from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import traceSelection from '@dbux/data/src/traceSelection';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import makeTreeItem, { makeTreeItemNoChildren, makeTreeItems, makeTreeChildren } from '../../helpers/makeTreeItem';
import { ContextTDNode, TraceTypeTDNode } from './traceInfoNodes';
import TraceDetailNode from './TraceDetailNode';
import { makeObjectArrayNodes } from '../../helpers/treeViewUtil';
import { renderDataNode } from '../../treeViewsShared/dataTreeViewUtil';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/** ###########################################################################
 * util
 *  #########################################################################*/

function parseStackTrace(stackTrace) {
  if (!stackTrace) {
    return [];
  }
  if (stackTrace.startsWith('"')) {
    stackTrace = JSON.parse(stackTrace);
  }
  const packages = Array.from(new Set(
    stackTrace.split('\n')
      .filter(s => s.includes('node_modules'))
      .map((s) => {
        // s = s.trim();
        return parsePackageName(s);
      })
      .filter(s => !!s)
  ));

  return {
    packages,
    raw: stackTrace
  };
}

// ###########################################################################
// Debug
// ###########################################################################


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

  /** ###########################################################################
   * more util
   *  #########################################################################*/

  mapPostAsyncEvent = (postEventUpdate) => {
    return {
      ...postEventUpdate,
      ...this.dp.util.getPostEventUpdateData(postEventUpdate)
    };
  }

  makeAsyncUpdateItem = (upd) => {
    const { dp } = this;
    return makeTreeItem(
      `${upd.rootId}`,
      upd,
      {
        description: `[${AsyncEventUpdateType.nameFrom(upd.type)}] trace=${upd.schedulerTraceId}`,
        handleClick: () => {
          const schedulerTrace = dp.util.getTrace(upd.schedulerTraceId);
          if (schedulerTrace) {
            traceSelection.selectTrace(schedulerTrace);
          }
        }
      }
    );
  }

  /** ###########################################################################
   * {@link buildChildren}
   *  #########################################################################*/

  // makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }

  buildChildren() {
    const { trace, dp } = this;

    const {
      traceId,
      nodeId: traceNodeId,
      contextId,
      rootContextId,
      // runId,
      staticTraceId,
      ...otherTraceProps
    } = trace;

    const renderTrace = {
      ...otherTraceProps,
      nodeId: traceNodeId
    };

    let context = dp.collections.executionContexts.getById(contextId) || EmptyObject;
    context = {
      ...context,
      stackTrace: parseStackTrace(context.stackTrace)
    };
    const rootContext = dp.collections.executionContexts.getById(rootContextId);

    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const { staticContextId } = context;
    const staticContext = dp.collections.staticContexts.getById(staticContextId) || EmptyObject;
    const { programId } = staticContext;
    const staticProgramContext = dp.collections.staticProgramContexts.getById(programId) || EmptyObject;
    const valueTraceId = dp.util.getValueTrace(traceId)?.traceId;

    /** ###########################################################################
     * context
     *  #########################################################################*/

    const contextNode = [`context`, context, { description: `${context?.contextId}` }];
    const rootContextNode = [`rootContext`, rootContext, { description: `${rootContext?.contextId}` }];


    // ###########################################################################
    // dataNodes
    // ###########################################################################

    const dataNodes = dp.indexes.dataNodes.byTrace.get(traceId);

    // NOTE: only used for BCE -> CER extra look-up
    const valueTraceDataNodes = valueTraceId && dp.util.getDataNodesOfTrace(valueTraceId) || null;

    let dataNode;
    if (traceNodeId) {
      dataNode = dp.collections.dataNodes.getById(traceNodeId);
    }
    else {
      dataNode = valueTraceDataNodes?.[0];
    }

    // let dataNodeIndex = valueTraceDataNodes?.indexOf(dataNode);
    // const isInValueTraceDataNodes = dataNodeIndex >= 0;
    // dataNodeIndex = isInValueTraceDataNodes ? dataNodeIndex : ownDataNodes?.indexOf(dataNode);

    // const ownDataNodeContainer = isInValueTraceDataNodes ? 'resultDataNodes' : 'ownDataNodes';
    // const ownDataNodeLabel = dataNode ? `${ownDataNodeContainer}[${dataNodeIndex}]` : `resultDataNodes: []`;
    // // const valueTraceDataNodeCount = valueTraceDataNodes?.length || 0;

    const allDataNodes = dataNodes?.map(n => renderDataNode(dp, n.nodeId)) || EmptyArray;


    /** ###########################################################################
     * value details
     *  #########################################################################*/


    const valueRef = dp.util.getTraceValueRef(valueTraceId);
    const refId = valueRef?.refId || 0;
    const valueRefNodeId = valueRef?.nodeId || 0;

    const hasValue = !!refId || !!dataNode?.hasValue;
    let valueNode;
    if (!hasValue) {
      valueNode = makeTreeItemNoChildren(
        '(no value or undefined)',
        // {
        //   description: ''
        // }
      );
    }
    else if (refId) {
      valueNode = makeTreeItem(
        'valueRef:',
        valueRef,
        {
          description: `refId=${refId}`
        }
      );
    }
    else {
      valueNode = makeTreeItemNoChildren(
        'value (Primitive):',
        {
          description: renderValueSimple(dataNode.value)
        }
      );
    }


    const valueRawRefNode = dp.indexes.values.byNodeId.get(valueRefNodeId)?.map(ref => {
      return makeTreeItem(
        valueRefNodeId ? 'valueRef (raw)' : '(DataNode has no ref)',
        ref,
        {}
      );
    });

    let valueRawSnapshotNode;
    if (refId) {
      const snapshot = dp.util.constructVersionedValueSnapshot(refId, traceId);
      valueRawSnapshotNode = makeTreeItem(
        'valueRef Snapshot (raw):',
        snapshot
      );
    }
    else {
      valueRawSnapshotNode = makeTreeItemNoChildren(
        '(DataNode has no ref)'
      );
    }


    // ###########################################################################
    // async (Root)
    // ###########################################################################

    const asyncNode = dp.indexes.asyncNodes.byRoot.getFirst(rootContextId);
    const asyncEventUpdates = dp.indexes.asyncEventUpdates.byRoot.get(rootContextId);

    // one POST event per `rootId`
    const postEventUpdates = asyncEventUpdates?.filter(({ type }) => isPostEventUpdate(type));
    const postEventUpdateData = postEventUpdates?.map(this.mapPostAsyncEvent);
    // const postEventUpdate = postEventUpdateData?.[0];

    // many PRE events per `rootId`
    const otherEventUpdates = asyncEventUpdates?.
      filter(({ type }) => !isPostEventUpdate(type))?.
      map(this.makeAsyncUpdateItem);


    /** ###########################################################################
     * Async Ancestor
     *  #########################################################################*/

    const nestingTraces = dp.util.getNestedAncestors(trace.rootContextId)
      .map((_traceId, i) => {
        const _trace = dp.collections.traces.getById(_traceId);
        return makeTreeItem(dp.util.makeTraceInfo(_trace), _trace, {
          description: `(traceId: ${_traceId})`,
          handleClick() {
            traceSelection.selectTrace(_trace);
          }
        });
      });

    const asyncTreeNode = makeTreeItem(
      'Async',
      {
        'Root AsyncNode': asyncNode,
        PostEventUpdateData: makeTreeItem(
          'Root PostEventUpdateData',
          postEventUpdateData?.length === 1 ? postEventUpdateData[0] : (postEventUpdateData || {}),
          { description: `${postEventUpdateData?.map(upd => AsyncEventUpdateType.nameFrom(upd.type)) || ''}` }
        ),
        ...makeObjectArrayNodes({
          'Root OtherUpdates': otherEventUpdates,
        }),
        Ancestors: makeTreeItem(
          `Root Async Ancestors`,
          nestingTraces,
          { description: `(${nestingTraces.length})` }
        ),
      },
      {
        description: `thread=${asyncNode?.threadId},rootId=${rootContextId}${postEventUpdateData?.map(upd => ` (${AsyncEventUpdateType.nameFrom(upd.type)})`) || ''}`
      }
    );


    // ###########################################################################
    // final result
    // ###########################################################################

    const children = [
      ...this.treeNodeProvider.buildDetailNodes(this.trace, this, [
        TraceTypeTDNode,
        ContextTDNode,
      ]),
      ...makeTreeItems(
        ['trace', renderTrace],
        contextNode,
        rootContextNode,
        makeTreeItem('value',
          {
            valueNode,
            dataNodes: makeTreeItem(
              'dataNodes',
              makeTreeItems(...allDataNodes),
              { description: allDataNodes.length }
            ),
            valueRawRefNode,
            valueRawSnapshotNode,
          },
          {
            description: `refId=${refId} (${allDataNodes.length} nodes)`
          }
        ),
        asyncTreeNode,
        ['staticTrace', staticTrace],
        ['staticContext', staticContext],
        ['staticProgramContext', staticProgramContext],
      )
    ];

    return children;
  }
}
