import { ViewColumn } from 'vscode';
import { goToTrace } from 'dbux-code/src/codeUtil/codeNav';
import { newLogger } from 'dbux-common/src/log/logger';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import allApplications from 'dbux-data/src/applications/allApplications';
import { makeTraceLabel } from 'dbux-data/src/helpers/traceLabels';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import TraceMode from './TraceMode';

const { log, debug, warn, error: logError } = newLogger('TraceNode');

export default class TraceNode extends HostComponentEndpoint {
  init() {
    const {
      trace
    } = this.state;

    // get name
    this.state.displayName = makeTraceLabel(trace);

    this.buildChildren();
    this.state.hasChildren = !!this.children.length;
  }

  buildChildren() {
    const {
      trace: {
        traceId,
        applicationId
      }
    } = this.state;
    const dp = allApplications.getById(applicationId).dataProvider;
    
    const mode = this.componentManager.doc.traceMode;
    if (mode === TraceMode.AllTraces) {
      const children = dp.indexes.executionContexts.byParentTrace.get(traceId) || EmptyArray;
      children.forEach(child => {
        return this.children.createComponent('ContextNode', {
          applicationId,
          context: child
        });
      });
    }
    else if (mode === TraceMode.ParentTraces) {
      const children = dp.indexes.executionContexts.byParentTrace.get(traceId) || EmptyArray;
      children.forEach(child => {
        return this.children.createComponent('ContextNode', {
          applicationId,
          context: child
        });
      });
    }
    else if (mode === TraceMode.ContextOnly) {
      logError('Creating TraceNode in mode \'ContextOnly\'');
      debugger;
    }
    else {
      logError('Unknown TraceMode', TraceMode.getName(mode), mode);
      debugger;
    }
  }

  public = {
    showTrace(applicationId, traceId) {
      const { dataProvider } = allApplications.getById(applicationId);
      const trace = dataProvider.collections.traces.getById(traceId);
      goToTrace(trace);
    }
  }
}