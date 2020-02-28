import { newLogger } from 'dbux-common/src/log/logger';
import Trace from 'dbux-common/src/core/data/Trace';
import last from 'lodash/last';
import DataProvider from '../DataProvider';

const { log, debug, warn, error: logError } = newLogger('CallGraph');

export default class CallGraph {
  _prevParentContext = [];
  _prevInContext = [];
  _prevChildContext = [];
  _nextParentContext = [];
  _nextInContext = [];
  _nextChildContext = [];
  _byParentContext: Array<Array<number>> = [];

  /**
   * @param {DataProvider} dp
   */
  constructor(dp) {
    this.dp = dp;

    dp._onDataInternal('contexts', this._postAddContexts);
    dp._onDataInternal('traces', this._postAddTraces);
  }

  // ###########################################################################
  //  Public
  // ###########################################################################
  getPreviousInContext(traceId) {
    return this.dp.collections.traces.getById(this._prevInContext[traceId]);
  }

  getNextInContext(traceId) {
    return this.dp.collections.traces.getById(this._nextInContext[traceId]);
  }

  getPreviousParentContext(traceId) {
    return this.dp.collections.traces.getById(this._prevParentContext[traceId]);
  }

  getNextParentContext(traceId) {
    return this.dp.collections.traces.getById(this._nextParentContext[traceId]);
  }

  getPreviousChildContext(traceId) {
    return this.dp.collections.traces.getById(this._prevChildContext[traceId]);
  }

  getNextChildContext(traceId) {
    return this.dp.collections.traces.getById(this._nextChildContext[traceId]);
  }

  // ###########################################################################
  //  Private
  // ###########################################################################

  _postAddContexts(contexts) {

  }
  
  /**
   * @param {Array<Trace>} newTraces 
   */
  _postAddTraces = (newTraces) => {
    for (const trace of newTraces) {
      const { traceId, contextId } = trace;
      // let rootContexts have parentContextId 0
      const context = this.dp.collections.executionContexts.getById(contextId);
      const parentContextId = context.parentContextId || 0;

      if (!this._byParentContext[parentContextId]) this._byParentContext[parentContextId] = [];
      this._byParentContext[parentContextId].push(traceId);
    }

    // next(prev)InContext
    for (let id = 0; id < this._byParentContext.length; id++) {
      const tracesByParent = this._byParentContext[id];
      if (!tracesByParent) continue;
      for (let i = 0; i < tracesByParent.length - 1; i++) {
        const traceId = tracesByParent[i];
        const nextId = tracesByParent[i + 1];
        this._prevInContext[nextId] = traceId;
        this._nextInContext[traceId] = nextId;
      }
    }

    // next(prev)ParentContext
    // skip id = 1 since rootContexts have no parentContext
    for (let id = 1; id < this._byParentContext.length; id++) {
      const tracesByParent = this._byParentContext[id];
      if (!tracesByParent) continue;
      const firstId = tracesByParent[0];
      const lastId = last(tracesByParent);

      let traceId;
      for (let i = 0; i < tracesByParent.length; i++) {
        traceId = tracesByParent[i];
        this._prevParentContext[traceId] = firstId;
        this._nextParentContext[traceId] = lastId;
      }
      this._prevParentContext[firstId] = firstId - 1;
      this._nextParentContext[lastId] = lastId + 1;
    }

    // next(prev)ChildContext
    for (let id = 0; id < this._byParentContext.length; id++) {
      const tracesByParent = this._byParentContext[id];
      if (!tracesByParent) continue;

      let continuousTraces = [];
      let hasChild = false;

      for (let i = 0; i < tracesByParent.length; i++) {
        if (!continuousTraces.length) continuousTraces.push(tracesByParent[i]);
        else if (tracesByParent[i] === last(continuousTraces) + 1) {
          continuousTraces.push(tracesByParent[i]);
        }
        else {
          // found non-neighboring traces, should assign next(prev)ChildContext
          if (hasChild) {
            const lastChildId = continuousTraces[0] - 1;
            this._assignPrevChild(continuousTraces, lastChildId);
          }
          const nextChildId = last(continuousTraces) + 1;
          this._assignNextChild(continuousTraces, nextChildId);

          continuousTraces = [tracesByParent[i]];
          hasChild = true;
        }
      }
      // assign the last continuous traces
      if (hasChild) {
        const lastChildId = continuousTraces[0] - 1;
        this._assignPrevChild(continuousTraces, lastChildId);
      }
    }
  }

  // ########################################
  //  Util
  // ########################################

  _assignPrevChild = (arr, prevChildId) => {
    const firstId = arr[0];
    for (let i = 1; i < arr.length; i++) {
      this._prevChildContext[arr[i]] = firstId;
    }
    this._prevChildContext[firstId] = prevChildId;
  }
  
  _assignNextChild = (arr, nextChildId) => {
    const lastId = last(arr);
    for (let i = 0; i < arr.length - 1; i++) {
      this._nextChildContext[arr[i]] = lastId;
    }
    this._nextChildContext[lastId] = nextChildId;
  }
}