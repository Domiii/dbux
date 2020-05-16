import allApplications from 'dbux-data/src/applications/allApplications';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import { makeTraceValueLabel } from 'dbux-data/src/helpers/traceLabels';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

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
    const label = displayName;
    this.state.displayName = label;

    const parentTrace = dp.util.getParentTraceOfContext(context.contextId);
    this.state.valueLabel = parentTrace && makeTraceValueLabel(parentTrace) || '';
    this.state.positionLabel = this._makeContextPositionLabel(applicationId, context);

    // add GraphNode controller
    this.controllers.createComponent('GraphNode', { });

    // add PopperController
    this.controllers.createComponent('PopperController');

    // add Highlighter
    this.highlighter = this.controllers.createComponent('Highlighter');

    // register with root
    this.context.graphRoot._contextNodeCreated(this);

    // build sub graph
    this.buildChildNodes();

    this.state.hasChildren = !!this.children.length;
  }

  buildChildNodes() {
    const {
      applicationId,
      context: {
        contextId
      }
    } = this.state;

    const dp = allApplications.getById(applicationId).dataProvider;

    // const mode = this.componentManager.doc.traceMode;
    // if (mode === TraceMode.AllTraces) {
    //   // get all traces
    //   const childTraces = dp.indexes.traces.byContext.get(contextId) || EmptyArray;
    //   childTraces.forEach(childTrace => {
    //     // create child trace
    //     return this.children.createComponent('TraceNode', {
    //       trace: childTrace
    //     });
    //   });
    // }
    // else if (mode === TraceMode.ParentTraces) {
    //   // get all traces
    //   const childTraces = dp.indexes.traces.byContext.get(contextId) || EmptyArray;
    //   childTraces
    //     .filter(trace => {
    //       const children = dp.indexes.executionContexts.byParentTrace.get(trace.traceId);
    //       return !!children?.length;
    //     })
    //     .forEach(childTrace => {
    //       // create child trace
    //       return this.children.createComponent('TraceNode', {
    //         trace: childTrace
    //       });
    //     });
    // }
    // else if (mode === TraceMode.ContextOnly) {

    // get all child contexts
    const childContexts = dp.indexes.executionContexts.children.get(contextId) || EmptyArray;
    childContexts.forEach(childContext => {
      // create child context
      return this.children.createComponent('ContextNode', {
        applicationId,
        context: childContext
      });
    });

    // }
    // else {
    //   this.logger.error('Unknown TraceMode', TraceMode.getName(mode), mode);
    // }
  }

  reveal() {
    this.controllers.getComponent('GraphNode').reveal();
  }

  _makeContextPositionLabel(applicationId, context) {
    const { staticContextId } = context;
    const dp = allApplications.getById(applicationId).dataProvider;
    const { programId, loc } = dp.collections.staticContexts.getById(staticContextId);
    const fileName = programId && dp.collections.staticProgramContexts.getById(programId).fileName || null;

    const { line, column } = loc.start;
    // return `@${fileName}:${line}:${column}`;
    return `${fileName}:${line}`;
  }

  public = {
    async showContext(applicationId, contextId) {
      const { dataProvider } = allApplications.getById(applicationId);
      const trace = dataProvider.util.getFirstTraceOfContext(contextId);
      await this.componentManager.externals.goToTrace(trace);
    },
    toggleStaticContextHighlight: () => {
      const { applicationId, context: { staticContextId } } = this.state;
      const contextNodeManager = this.context.graphRoot.controllers.getComponent('ContextNodeManager');
      contextNodeManager.toggleStaticContextHighlight(applicationId, staticContextId);
    }
  }
}

export default ContextNode;