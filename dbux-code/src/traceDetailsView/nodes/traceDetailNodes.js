import omit from 'lodash/omit';
import allApplications from '@dbux/data/src/applications/allApplications';
import { makeTreeItems } from '../../helpers/treeViewHelpers';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import StaticTraceTDNode from './StaticTraceTDNodes';
import StaticContextTDNode from './StaticContextTDNodes';
import TrackObjectTDNode from './TrackObjectTDNodes';
import ValueTDNode from './ValueTDNode';
import { InfoTDNode } from './traceInfoNodes';

export class TraceDetailNode extends BaseTreeViewNode {
}

// ###########################################################################
// Debug
// ###########################################################################

export class DebugTDNode extends TraceDetailNode {
  static makeTraceDetail(trace, parent) {
    return trace;
  }

  static makeLabel(trace, parent) {
    return 'Debug';
  }

  init() {
    this.description = `id: ${this.trace.traceId}`;
  }

  // makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }

  buildChildren() {
    const { trace } = this;

    const application = allApplications.getApplication(trace.applicationId);
    const { dataProvider } = application;

    const {
      traceId,
      contextId,
      staticTraceId,
      valueId,
      ...otherTraceProps
    } = trace;

    const context = dataProvider.collections.executionContexts.getById(contextId);
    const staticTrace = dataProvider.collections.staticTraces.getById(staticTraceId);
    const { staticContextId } = context;
    const staticContext = dataProvider.collections.staticContexts.getById(staticContextId);

    const valueRef = valueId && dataProvider.collections.values.getById(valueId);
    const valueNode = [
      'valueRef', 
      valueRef,
      { 
        description: (valueRef?.valueId + '') || 0
      }
    ];

    const children = makeTreeItems(
      ['trace', otherTraceProps],
      [`context`, context],
      ['staticTrace', omit(staticTrace, 'loc')],
      ['staticContext', omit(staticContext, 'loc')],
      valueNode
    );

    return children;
  }
}

// ###########################################################################
// DetailNodeClasses
// ###########################################################################

export const DetailNodeClasses = [
  ValueTDNode,
  TrackObjectTDNode,
  StaticTraceTDNode,
  // StaticContextTDNode,
  InfoTDNode,
  DebugTDNode
];