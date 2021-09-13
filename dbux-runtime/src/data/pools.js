import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import Trace from '@dbux/common/src/types/Trace';
import ValueRef from '@dbux/common/src/types/ValueRef';
import DataNode from '@dbux/common/src/types/DataNode';
import Loop from '@dbux/common/src/types/loops/Loop';
import PromiseData from '@dbux/common/src/types/PromiseData';
import AsyncEvent from '@dbux/common/src/types/AsyncEvent';
import AsyncNode from '@dbux/common/src/types/AsyncNode';
import { PreAwaitUpdate, PostAwaitUpdate, PreThenUpdate, PostThenUpdate } from '@dbux/common/src/types/AsyncEventUpdate';
import PromiseLink from '@dbux/common/src/types/PromiseLink';

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
  },

  // ###########################################################################
  // AsyncEventUpdate
  // ###########################################################################

  preAwaitUpdates: {
    allocate() {
      return new PreAwaitUpdate();
    }
  },
  postAwaitUpdates: {
    allocate() {
      return new PostAwaitUpdate();
    }
  },
  preThenUpdates: {
    allocate() {
      return new PreThenUpdate();
    }
  },
  postThenUpdates: {
    allocate() {
      return new PostThenUpdate();
    }
  },
  promiseLinks: {
    allocate() {
      return new PromiseLink();
    }
  }
};

export default pools;