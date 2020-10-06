
import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { emitEditorAction } from '@dbux/projects/src/userEvents';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('codeEvents');

const Verbose = false;
// const Verbose = true;

const defaultNewEventLineThreshold = 5;

/**
 * Convert vscode `Position` object to normal object.
 * @param {Position} position 
 */
function convertPosition(position = EmptyObject) {
  return {
    line: position.line,
    character: position.character,
  };
}

function isNewData(previousData, newData) {
  if (previousData?.file !== newData.file) {
    return true;
  }
  if (Math.abs(previousData.rangeStart.line - newData.rangeStart.line) >= defaultNewEventLineThreshold) {
    return true;
  }
  if (Math.abs(previousData.rangeEnd.line - newData.rangeEnd.line) >= defaultNewEventLineThreshold) {
    return true;
  }

  return false;
}

let _previousSelectionData, _previousRangeData;
export function initCodeEvents() {
  window.onDidChangeTextEditorSelection((e) => {
    if (e.kind === undefined) {
      return;
    }
    // TODO?: take only first selection only. Do we need all selections? Can there be no selections?
    let firstSelection = e.selections[0] || EmptyObject;
    const data = {
      file: e.textEditor._documentData._document.uri.path,
      rangeStart: convertPosition(firstSelection.start),
      rangeEnd: convertPosition(firstSelection.end),
      type: 'selection',
    };

    debug('new selection data', data);
    if (isNewData(_previousSelectionData, data)) {
      debug('is new');
      emitEditorAction(data);
      _previousSelectionData = data;
    }
  });

  window.onDidChangeTextEditorVisibleRanges((e) => {
    // TODO?: take only first range only. Do we need all range? Can there be no range?
    let firstRange = e.visibleRanges[0] || EmptyObject;
    const data = {
      file: e.textEditor._documentData._document.uri.path,
      rangeStart: convertPosition(firstRange.start),
      rangeEnd: convertPosition(firstRange.end),
      type: 'visible',
    };

    debug('new range data', data);
    if (isNewData(_previousRangeData, data)) {
      debug('is new');
      emitEditorAction(data);
      _previousRangeData = data;
    }
  });
}