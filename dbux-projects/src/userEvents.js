import NanoEvents from 'nanoevents';

// ###########################################################################
// events
// NOTE: data *must* always be completely serializable, simple data.
// ###########################################################################

export function emitEditorAction(data) {
  emitUserEvent('editor', data);
}

export function emitPracticeSessionSolved(practiceSession) {
  emitUserEvent('practiceSessionSolved', {
    sessionId: practiceSession.sessionId,
    bugId: practiceSession.bug.id
  });
}

export function emitPracticeSessionStarted(practiceSession) {
  emitUserEvent('practiceSessionStarted', {
    sessionId: practiceSession.sessionId,
    bugId: practiceSession.bug.id
  });
}

export function emitPracticeSessionStopped(practiceSession) {
  emitUserEvent('practiceSessionStopped', {
    sessionId: practiceSession.sessionId,
    bugId: practiceSession.bug.id
  });
}

export function emitNewTestRun(practiceSession, testRun) {
  emitUserEvent('testRunFinished', {
    sessionId: practiceSession?.sessionId,
    bugId: testRun.bugId,
    testRun
  });
}

export function emitNewBugProgress(practiceSession, bugProgress) {
  emitUserEvent('newBugProgress', {
    sessionId: practiceSession?.sessionId,
    bugId: bugProgress.bugId,
    bugProgress
  });
}

export function emitBugProgressChanged(practiceSession, bugProgress) {
  emitUserEvent('bugProgressChanged', {
    sessionId: practiceSession?.sessionId,
    bugId: bugProgress.bugId,
    bugProgress
  });
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