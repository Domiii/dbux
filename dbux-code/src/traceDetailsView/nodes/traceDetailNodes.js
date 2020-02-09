import { TreeItemCollapsibleState } from 'vscode';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import TraceDetailsNodeType from '../TraceDetailsNodeType';
import { BaseNode } from './TraceDetailsNode';
import { goToTrace } from '../../codeNav';
import Application from 'dbux-data/src/Application';

export class TraceDetailNode extends BaseNode {
  init(traceDetail) {
    this.traceDetail = traceDetail;
    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  static get nodeType() {
    return TraceDetailsNodeType.TraceDetail;
  }
}

export class TypeTDNode extends TraceDetailNode {
  init(trace) {
    this.trace = trace;
    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  static get nodeType() {
    return TraceDetailsNodeType.NextContextTraceDetail;
  }

  static makeTraceDetail(trace, application: Application, parent) {
    return trace;
  }

  static makeLabel(trace, application: Application, parent) {
    const traceType = application.dataProvider.util.getTraceType(trace.traceId);
    const typeName = TraceType.nameFrom(traceType);
    return `Type: ${typeName}`;
  }

  // static makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }
}

export class PreviousContextTraceTDNode extends TraceDetailNode {
  init(previousTrace) {
    this.previousTrace = previousTrace;
    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  _handleClick() {
    goToTrace(this.previousTrace);
  }

  static get nodeType() {
    return TraceDetailsNodeType.PreviousContextTraceDetail;
  }

  static makeTraceDetail(trace, application: Application, parent) {
    const { traceId, contextId } = trace;
    const previousTrace = application.dataProvider.util.getPreviousTrace(traceId);
    if (!previousTrace || previousTrace.contextId === contextId) {
      return null;
    }
    return previousTrace;
  }

  static makeLabel(previousTrace, application: Application, parent) {
    const currentTrace = parent.trace;
    const currentTraceType = application.dataProvider.util.getTraceType(currentTrace.traceId);
    let previous;
    if (currentTraceType === TraceType.ExpressionResult) {
      // previous = '→';
      previous = '↓'; // go into function call
    }
    else {
      // previous = '←';
      previous = '↑';
    }

    // get displayName of previous context
    const staticContext = application.dataProvider.util.getTraceStaticContext(previousTrace.traceId);
    const { displayName } = staticContext;

    return `${previous} ${displayName}`;
  }


  // static makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }
}

export class NextContextTraceTDNode extends TraceDetailNode {
  init(nextTrace) {
    this.nextTrace = nextTrace;
    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  _handleClick() {
    goToTrace(this.nextTrace);
  }

  static get nodeType() {
    return TraceDetailsNodeType.NextContextTraceDetail;
  }

  static makeTraceDetail(trace, application: Application, parent) {
    const { traceId, contextId } = trace;
    const nextTrace = application.dataProvider.util.getNextTrace(traceId);
    if (!nextTrace || nextTrace.contextId === contextId) {
      return null;
    }
    return nextTrace;
  }

  static makeLabel(nextTrace, application: Application, parent) {
    const staticContext = application.dataProvider.util.getTraceStaticContext(nextTrace.traceId);
    const { displayName } = staticContext;
    return `↓ ${displayName}`;
  }

  // static makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }
}


export class ValueTDNode extends TraceDetailNode {
  init(trace) {
    this.trace = trace;
    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  static get nodeType() {
    return TraceDetailsNodeType.Value;
  }

  static makeTraceDetail(trace, application: Application, parent) {
    const { traceId } = trace;
    const { dataProvider } = application;
    const hasValue = dataProvider.util.doesTraceHaveValue(traceId);
    return hasValue ? trace : null;
  }

  static makeLabel(trace, application: Application, parent) {
    const { traceId } = trace;
    const { dataProvider } = application;
    const value = dataProvider.util.getTraceValue(traceId);
    return `Value: ${value}`;
  }

  // static makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }
}