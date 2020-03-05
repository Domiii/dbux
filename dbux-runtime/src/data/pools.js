import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import Trace from 'dbux-common/src/core/data/Trace';
import ValueRef from 'dbux-common/src/core/data/ValueRef';

/**
 * TODO: proper object pooling
 */
const pools = {
  executionContexts: {
    /**
     * @return {ExecutionContext}
     */
    allocate(contextType, stackDepth, runId, parentContextId, parentTraceId, contextId, staticContextId, orderId, schedulerTraceId) {
      // TODO: use object pooling
      const context = new ExecutionContext();
      context.contextType = contextType;
      // context.stackDepth = stackDepth;  // not quite necessary, so we don't store it, for now
      context.runId = runId;
      context.parentContextId = parentContextId;
      context.parentTraceId = parentTraceId;
      context.contextId = contextId;
      context.staticContextId = staticContextId;
      context.orderId = orderId;
      context.schedulerTraceId = schedulerTraceId;
      context.createdAt = Date.now();  // { createdAt }
      // context.resumedChildren = null;

      return context;
    }
  },

  traces: {
    allocate() {
      return new Trace();
    }
  },

  values: {
    allocate() {
      return new ValueRef();
    }
  }
};

export default pools;