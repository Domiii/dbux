import NanoEvents from 'nanoevents';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('UserEvents');

const Verbose = false;
// const Verbose = true;

// ###########################################################################
// events
// NOTE: data *must* always be completely serializable, simple data.
// ###########################################################################

export function emitEditorAction(data) {
  emitUserEvent('editor', data);
}

export function emitPracticeSelectTraceAction(selectMethodName, trace, detail) {
  emitUserEvent(selectMethodName, {
    trace,
    locationInfo: getExtraTraceLocationImformation(trace),
    detail
  });
}

export function emitTreeViewAction(treeViewName, action, nodeId, args) {
  emitUserEvent('treeView', {
    treeViewName,
    action,
    nodeId,
    args
  });
}

export function emitCallGraphAction(data) {
  emitUserEvent('callGraph', data);
}

export function emitOther(data) {
  emitUserEvent('other', data);
}

// ###########################################################################
// Util
// ###########################################################################

function getExtraTraceLocationImformation(trace) {
  const { applicationId, traceId, staticTraceId } = trace;
  const dp = allApplications.getById(applicationId).dataProvider;

  const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
  const staticContext = dp.collections.staticContexts.getById(staticTrace.staticContextId);
  const filePath = dp.util.getTraceFilePath(traceId);
  return {
    filePath,
    staticTrace,
    staticContext,
    staticTraceIndex: trace.staticTraceIndex
  };
}

// ###########################################################################
// emitter
// ###########################################################################

let emitter = new NanoEvents();

export function onUserEvent(cb) {
  return emitter.on('e', cb);
}

function emitUserEvent(name, data) {
  Verbose && debug(`name: ${name}, data:`, data);
  emitter.emit('e', name, data);
}