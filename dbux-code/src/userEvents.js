import NanoEvents from 'nanoevents';

// ###########################################################################
// events
// NOTE: data *must* always be completely serializable, simple data.
// ###########################################################################

export function emitEditorAction(data) {
  emitUserEvent('editor', data);
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
// emitter
// ###########################################################################

let emitter = new NanoEvents();

export function onUserEvent(cb) {
  return emitter.on('e', cb);
}

function emitUserEvent(name, data) {
  emitter.emit('e', name, data);
}