import NanoEvents from 'nanoevents';

// ###########################################################################
// events
// NOTE: data *must* always be completely serializable, simple data.
// ###########################################################################

export function emitEditorAction(data) {
  emitUserEvent('editor', data);
}


// ###########################################################################
// emitter
// ###########################################################################

let emitter = new NanoEvents();

export function onUserEvent() {
  emitter.on('e');
}

function emitUserEvent(name, data) {
  emitter.emit('e', name, data);
}