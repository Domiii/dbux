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
    allocate(contextType, stackDepth, contextId, staticContextId, orderId, parentContextId, schedulerTraceId) {
      // TODO: use object pooling
      const context = new ExecutionContext();
      context.contextType = contextType;
      context.stackDepth = stackDepth;
      context.contextId = contextId;
      context.staticContextId = staticContextId;
      context.orderId = orderId;
      context.parentContextId = parentContextId;
      context.schedulerTraceId = schedulerTraceId;
      context.createdAt = Date.now();
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