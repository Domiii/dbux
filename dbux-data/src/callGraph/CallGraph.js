import { newLogger } from 'dbux-common/src/log/logger';
import Trace from 'dbux-common/src/core/data/Trace';
import last from 'lodash/last';
import DataProvider from '../DataProvider';
import TraceType from 'dbux-common/src/core/constants/TraceType';

const { log, debug, warn, error: logError } = newLogger('CallGraph');

export default class CallGraph {
  _prevParentContext = [];
  _prevInContext = [];
  _prevChildContext = [];
  _nextParentContext = [];
  _nextInContext = [];
  _nextChildContext = [];
  _byParentContext: Array<Array<number>> = [];
  _byContext: Array<Array<number>> = [];

  /**
   * @param {DataProvider} dp
   */
  constructor(dp) {
    this.dp = dp;

    dp._onDataInternal('contexts', this._postAddContexts);
    // dp._onDataInternal('traces', this._postAddTraces);
    dp._onDataInternal('traces', this._postAddTraces0);
  }

  // ###########################################################################
  //  Public
  // ###########################################################################
  getPreviousInContext(traceId) {
    return this._prevInContext[traceId];
  }

  getNextInContext(traceId) {
    return this._nextInContext[traceId];
  }

  getPreviousParentContext(traceId) {
    return this._prevParentContext[traceId];
  }

  getNextParentContext(traceId) {
    return this._nextParentContext[traceId];
  }

  getPreviousChildContext(traceId) {
    return this._prevChildContext[traceId];
  }

  getNextChildContext(traceId) {
    return this._nextChildContext[traceId];
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

      if (!this._byContext[contextId]) this._byContext[contextId] = [];
      this._byContext[contextId].push(traceId);
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

  /**
   * @param {Array<Trace>} newTraces 
   */
  _postAddTraces0 = (newTraces) => {
    debugger;
    let stack: Array<Array<Trace>> = [];
    let lastTrace = null;
    let lastContext = null;
    for (let trace of newTraces) {
      if (!stack.length) {
        stack.push([trace]);
        lastTrace = trace;
        lastContext = this._getContextByTrace(trace);
        continue;
      }
      const context = this._getContextByTrace(trace);
      if (context.parentContextId === lastContext.contextId) {
        // push
        this._processUnassignedTraces(last(stack), trace);
        stack.push([trace]);
      }
      else if (context.contextId === lastContext.parentContextId) {
        // pop
        const children = stack.pop();
        this._processUnassignedTraces(children, trace);
        this._assignPrevChildRelation([trace], last(children));
        this._assignInContextRelation(last(last(stack)), trace);
        this._assignParentRelation(last(last(stack)), trace, children);
        last(stack).push(trace);
      }
      else if (context.contextId === lastContext.contextId) {
        // sibling traces
        this._assignInContextRelation(last(last(stack)), trace);
        last(stack).push(trace);
      }
      else if (context.parentContextId === lastContext.parentContextId) {
        // is sibling context (should be pop and push callback)
        if (lastTrace.type !== TraceType.PopCallback) {
          logError('First of \'sibling context of neighboring traces\' is not popCallback');
        }
        if (trace.type !== TraceType.PushCallback) {
          logError('Second of \'sibling context of neighboring traces\' is not pushCallback');
        }

        this._assignInContextRelation(last(last(stack)), trace);
        last(stack).push(trace);
      }
      else {
        logError('Neighboring traces having unexpected context relation');
      }
      lastTrace = trace;
      lastContext = context;
    }
    debugger;
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

  _processUnassignedTraces = (lastStack, newTrace) => {
    const unassignedTraces = this._getUnassignedTraces(lastStack);
    this._assignNextChildRelation(unassignedTraces, newTrace);
    const lastChild = this._prevChildContext[unassignedTraces[0].traceId];
    if (lastChild) {
      this._assignPrevChildRelation(unassignedTraces, lastChild);
    }
  }

  /**
   * @param {Trace} prevParent
   * @param {Trace} nextParent
   * @param {Array<Trace>} children
   */
  _assignParentRelation = (prevParent, nextParent, children) => {
    const firstChild = children[0];
    const lastChild = last(children);
    for (let trace of children) {
      this._prevParentContext[trace.traceId] = firstChild;
      this._nextParentContext[trace.traceId] = lastChild;
    }
    this._prevParentContext[firstChild.traceId] = prevParent;
    this._nextParentContext[lastChild.traceId] = nextParent;
  }

  _assignInContextRelation = (trace1, trace2) => {
    this._prevInContext[trace2.traceId] = trace1;
    this._nextInContext[trace1.traceId] = trace2;
  }

  /**
   * @param {Array<Trace>} traces
   * @param {Trace} nextChild
   */
  _assignPrevChildRelation = (traces, prevChild) => {
    for (let trace of traces) {
        this._prevChildContext[trace.traceId] = prevChild;
    }
  }
  
  /**
   * @param {Array<Trace>} traces
   * @param {Trace} nextChild
   */
  _assignNextChildRelation = (traces, nextChild) => {
    for (let trace of traces) {
      this._nextChildContext[trace.traceId] = nextChild;
    }
  }

  _getContextByTrace = (trace) => {
    return this.dp.collections.executionContexts.getById(trace.contextId);
  }

  /**
   * @param {Array<Trace>} traces
   */
  _getUnassignedTraces = (traces) => {
    for (let i = traces.length - 1; i >= 0; i--) {
      if (this._nextChildContext[traces[i].traceId]) {
        return traces.slice(i + 1);
      }
    }
    return traces
  }
}