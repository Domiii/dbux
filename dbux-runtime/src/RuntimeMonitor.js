import programStaticContextCollection from './data/collections/programStaticContextCollection';
import ProgramMonitor from './ProgramMonitor';
import { logInternalError } from './log/logger';
import executionContextCollection from './data/collections/executionContextCollection';
import executionEventCollection from './data/collections/executionEventCollection';

/**
 * 
 */
export default class RuntimeMonitor {
  static _instance;
  /**
   * Singleton
   * @type {RuntimeMonitor}
   */
  static get instance() {
    return this._instance || (this._instance = new RuntimeMonitor());
  }

  /**
   * Set of all active/scheduled calls.
   */
  _activeRoots = new Set();

  /**
   * The currently executing stack.
   */
  _executingContextRoot = null;
  _executingDepth = 0;

  _programMonitors = new Map();


  // ###########################################################################
  // Bookkeeping
  // ###########################################################################

  // getContext(contextId) {
  //   return this._contexts;
  // }

  /**
   * @returns {ProgramMonitor}
   */
  addProgram(programData) {
    const programStaticContext = programStaticContextCollection.addProgram(programData);
    const programMonitor = new ProgramMonitor(programStaticContext);
    this._programMonitors.set(programStaticContext.getProgramId(), programMonitor);
    return programMonitor;
  }


  // ###########################################################################
  // public interface
  // ###########################################################################

  /**
   * 
   */
  pushImmediate(programId, staticContextId) {
    const rootId = this._executingContextRoot?.contextId;

    // register context
    const context = executionContextCollection.addImmediate(programId, staticContextId, rootId);
    const { contextId } = context;
    if (!this._executingContextRoot) {
      // no executing stack -> this invocation has been called from some system or blackboxed scheduler
      this._executingContextRoot = context;
      this._activeRoots.add(contextId);
    }

    // misc updates
    ++this._executingDepth;

    // log event
    executionEventCollection.logPushImmediate(contextId, this._executingDepth);
    
    return contextId;
  }


  popImmediate(contextId) {
    // sanity checks
    const context = executionContextCollection.getContext(contextId);
    if (!context) {
      logInternalError('Tried to popImmediate context that was not registered:', contextId);
      return;
    }

    const executingRootContextId = this._executingContextRoot?.rootContextId;
    if (context.rootContextId !== executingRootContextId) {
      logInternalError('Tried to popImmediate context whose rootContextId does not match executingContextRoot - ', context.rootContextId, '!==', executingRootContextId);
      return;
    }

    // misc updates
    --this._executingDepth;
    if (!this._executingDepth) {
      // last on stack
      if (contextId !== executingRootContextId) {
        logInternalError('Tried to popImmediate last context on stack but is not executingContextRoot - ', contextId, '!==', executingRootContextId);
        return;
      }
      this._executingContextRoot = null;
      this._activeRoots.delete(executingRootContextId);
    }

    // log event
    executionEventCollection.logPopImmediate(contextId, this._executingDepth);
  }


  // /**
  //  * Push a new context for a scheduled callback for later execution.
  //  * Especially for: (1) await, (2) promise, (3) time event, (4) other callback scheduling
  //  */
  // scheduleCallback() {
  //   // this is not an immediate invocation, but scheduled for later
  //   if (!this._executingStack) {
  //     // there must be an active stack from where the scheduling happened
  //     logError('No activeStack when scheduling callback call from:', schedulerId);
  //   }
  //   TraceLog.instance.logSchedule(contextId, schedulerId);
  // }

  // pushCallbackLink(scheduledContextId) {
  //   const linkedContext = ;
  //   if (!linkedContext) {
  //     logError('pushCallbackLink\'s `scheduledContextId` does not exist:', scheduledContextId);
  //     return;
  //   }

  //   // TODO: linking contexts/stacks
  //   // const linkId = ;
  //   return linkId;
  // }

  // popSchedule() {

  // }
}