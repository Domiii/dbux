import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import Trace from '@dbux/common/src/core/data/Trace';
import ValueRef from '@dbux/common/src/core/data/ValueRef';
import DataNode from '@dbux/common/src/core/data/DataNode';
import Loop from '@dbux/common/src/core/data/loops/Loop';
import PromiseData from '@dbux/common/src/core/data/PromiseData';
import AsyncEvent from '@dbux/common/src/core/data/AsyncEvent';
import AsyncNode from '@dbux/common/src/core/data/RootContext';

/**
 * TODO: proper object pooling
 */
const pools = {
  executionContexts: {
    /**
     * @return {ExecutionContext}
     */
    allocate() {
      return new ExecutionContext();
    }
  },

  traces: {
    allocate() {
      return new Trace();
    }
  },

  dataNodes: {
    allocate() {
      return new DataNode();
    }
  },

  values: {
    allocate() {
      return new ValueRef();
    }
  },

  loops: {
    allocate() {
      return new Loop();
    }
  },

  promiseData: {
    allocate() {
      return new PromiseData();
    },
  },

  asyncEvent: {
    allocate() {
      return new AsyncEvent();
    }
  },

  asyncNodes: {
    allocate() {
      return new AsyncNode();
    }
  }
};

export default pools;