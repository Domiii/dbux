import { ViewColumn } from 'vscode';
import { goToTrace } from 'dbux-code/src/codeUtil/codeNav';
import { newLogger } from 'dbux-common/src/log/logger';
import allApplications from 'dbux-data/src/applications/allApplications';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import TraceMode from './TraceMode';

const { log, debug, warn, error: logError } = newLogger('ContextNode');

class ContextNode extends HostComponentEndpoint {
  init() {
    const {
      applicationId,
      context
    } = this.state;

    const dp = allApplications.getById(applicationId).dataProvider;

    // get name (and other needed data)
    const staticContext = dp.collections.staticContexts.getById(context.staticContextId);
    const {
      displayName
    } = staticContext;
    const label = displayName + this._makeContextPositionLabel(applicationId, context);
    this.state.displayName = label;

    this.buildChildren();
    this.state.hasChildren = !!this.children.length;
  }

  buildChildren() {
    const {
      applicationId,
      context: {
        contextId
      }
    } = this.state;
    const dp = allApplications.getById(applicationId).dataProvider;

    const mode = this.componentManager.doc.traceMode;
    if (mode === TraceMode.AllTraces) {
      // get all traces
      const childTraces = dp.indexes.traces.byContext.get(contextId) || EmptyArray;
      childTraces.forEach(childTrace => {
        // create child trace
        return this.children.createComponent('TraceNode', {
          trace: childTrace
        });
      });
    }
    else if (mode === TraceMode.ParentTraces) {
      // get all traces
      const childTraces = dp.indexes.traces.byContext.get(contextId) || EmptyArray;
      childTraces
        .filter(trace => {
          const children = dp.indexes.executionContexts.byParentTrace.get(trace.traceId);
          return !!children?.length;
        })
        .forEach(childTrace => {
          // create child trace
          return this.children.createComponent('TraceNode', {
            trace: childTrace
          });
        });
    }
    else if (mode === TraceMode.ContextOnly) {
      // get all child context
      const childContexts = dp.indexes.executionContexts.children.get(contextId) || EmptyArray;
      childContexts.forEach(childContext => {
        // create child context
        return this.children.createComponent('ContextNode', {
          applicationId,
          context: childContext
        });
      });
    }
    else {
      logError('Unknown TraceMode', TraceMode.getName(mode), mode);
    }
  }

  _makeContextPositionLabel(applicationId, context) {
    const { staticContextId } = context;
    const dp = allApplications.getById(applicationId).dataProvider;
    const { programId, loc } = dp.collections.staticContexts.getById(staticContextId);
    const fileName = programId && dp.collections.staticProgramContexts.getById(programId).fileName || null;

    const { line, column } = loc.start;
    return `@${fileName}:${line}:${column}`;
  }

  public = {
    showContext(applicationId, contextId) {
      const { dataProvider } = allApplications.getById(applicationId);
      const trace = dataProvider.util.getFirstTraceOfContext(contextId);
      goToTrace(trace, ViewColumn.Beside);
    }
  }
}

export default ContextNode;