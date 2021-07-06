import omit from 'lodash/omit';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { makeTreeItems } from '../../helpers/treeViewHelpers';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import ExecutionsTDNode from './ExecutionsTDNodes';
// import StaticContextTDNode from './StaticContextTDNodes';
import TrackObjectTDNode from './TrackObjectTDNodes';
import ValueTDRefNode from './ValueTDRefNode';
import ValueTDSimpleNode from './ValueTDSimpleNode';
import { InfoTDNode, ContextTDNode, TraceTypeTDNode } from './traceInfoNodes';
// import NearbyValuesTDNode from './NearbyValuesTDNode';

/** @typedef {import('@dbux/common/src/core/data/Trace').default} Trace */

/**
 * @property {Trace} trace
 */
export class TraceDetailNode extends BaseTreeViewNode {
  get trace() {
    return this.entry;
  }
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

  // makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }

  buildChildren() {
    const { trace } = this;
    const { nodeId } = trace;

    const application = allApplications.getApplication(trace.applicationId);
    const { dataProvider } = application;

    const {
      traceId,
      runId,
      contextId,
      staticTraceId,
      ...otherTraceProps
    } = trace;

    const context = dataProvider.collections.executionContexts.getById(contextId);
    const staticTrace = dataProvider.collections.staticTraces.getById(staticTraceId);
    const { staticContextId } = context;
    const staticContext = dataProvider.collections.staticContexts.getById(staticContextId);
    const dataNodes = dataProvider.util.getDataNodesOfTrace(traceId);

    let dataNode;
    if (nodeId) {
      dataNode = dataProvider.collections.dataNodes.getById(nodeId);
    }
    else {
      dataNode = dataNodes?.[0];
    }

    const dataNodeLabel = dataNode ? `dataNodes[${dataNodes?.indexOf(dataNode)}]` : `dataNodes: []`;
    const dataNodeCount = dataNodes?.length || 0;

    const allDataNodes = (
      dataNodeCount > 1 ?
        [[`all dataNodes (${dataNodeCount})`, dataNodes]] :
        EmptyArray
    );

    const refId = dataNode?.refId;
    const valueRef = refId && dataProvider.collections.values.getById(refId);
    const valueNode = [
      'valueRef',
      valueRef,
      {
        description: (valueRef?.valueId + '') || 0
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

    const asyncEventChildren = [
      'asyncEventRef',
      dataProvider.indexes.asyncEvents.byFrom.get(runId),
    ];

    const runNode = [
      'run',
      dataProvider.collections.runs.getById(runId),
    ];


    const children = [
      ...this.treeNodeProvider.buildDetailNodes(this.trace, this, [
        TraceTypeTDNode,
        ContextTDNode,
      ]),
      ...makeTreeItems(
        ['trace', otherTraceProps],
        [dataNodeLabel, dataNode],
        valueNode,
        ...allDataNodes,
        runNode,
        asyncEventChildren,
        [`context`, context],
        // ['staticTrace', omit(staticTrace, 'loc')],
        ['staticTrace', staticTrace],
        ['staticContext', omit(staticContext, 'loc')],
        // promiseNode
      )
    ];

    return children;
  }
}

// ###########################################################################
// DetailNodeClasses
// ###########################################################################

export const DetailNodeClasses = [
  ValueTDRefNode,
  ValueTDSimpleNode,
  TrackObjectTDNode,
  ExecutionsTDNode,
  // DataNodeTDNode,
  // NearbyValuesTDNode,
  // StaticContextTDNode,
  // InfoTDNode,
  DebugTDNode
];