
import { commands, SymbolKind, window } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { emitEditorAction } from '../userEvents';
import { getOrCreateTracesAtCursor } from '../traceDetailsView/TracesAtCursor';
import { codeRangeToBabelLoc } from '../helpers/codeLocHelpers';

/** @typedef {import('@dbux/projects/src/ProjectsManager').default} ProjectsManager */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('codeEvents');

const Verbose = false;
// const Verbose = true;

const defaultNewEventLineThreshold = 5;

let _previousSelectionData, _previousRangeData;

/**
 * @param {ProjectsManager} manager 
 */
export function initCodeEvents(manager, context) {
  const traceAtCursor = getOrCreateTracesAtCursor(context);

  window.onDidChangeTextEditorSelection(async (e) => {
    if (!manager.practiceSession) {
      return;
    }

    if (e.kind === undefined) {
      return;
    }

    if (e.textEditor.document.uri.scheme !== 'file') {
      return;
    }

    // TODO?: take only first selection only. Do we need all selections? Can there be no selections?
    const firstSelection = e.selections[0] || EmptyObject;
    let data = {
      file: e.textEditor.document.uri.path,
      rangeStart: convertPosition(firstSelection.start),
      rangeEnd: convertPosition(firstSelection.end),
      type: 'selection',
    };

    Verbose && debug('new selection data', data);
    if (isNewData(_previousSelectionData, data)) {
      Verbose && debug('is new');
      data = { ...data, ...await getExtraEditorEventInfo(e.textEditor) };
      emitEditorAction(data);
      _previousSelectionData = data;
    }
  });

  window.onDidChangeTextEditorVisibleRanges(async (e) => {
    if (!manager.practiceSession) {
      return;
    }

    if (e.textEditor.document.uri.scheme !== 'file') {
      return;
    }

    // TODO?: take only first range only. Do we need all range? Can there be no range?
    const firstRange = e.visibleRanges[0] || EmptyObject;
    let data = {
      file: e.textEditor.document.uri.path,
      rangeStart: convertPosition(firstRange.start),
      rangeEnd: convertPosition(firstRange.end),
      type: 'visible',
    };

    Verbose && debug('new range data', data);
    if (isNewData(_previousRangeData, data)) {
      Verbose && debug('is new');
      data = { ...data, ...await getExtraEditorEventInfo(e.textEditor) };
      emitEditorAction(data);
      _previousRangeData = data;
    }
  });

  // ###########################################################################
  // extra data for code events
  // ###########################################################################

  async function getExtraEditorEventInfo(editor) {
    const trace = traceAtCursor.getMostInner();
    let staticTrace = null;
    let staticContext = null;
    if (trace) {
      const { applicationId, staticTraceId } = trace;
      const dp = allApplications.getById(applicationId).dataProvider;
      staticTrace = dp.collections.staticTraces.getById(staticTraceId);
      staticContext = dp.collections.staticContexts.getById(staticTrace.staticContextId);
    }
    const symbol = await getSymbolAt(editor.document.uri, editor.selections[0]?.start);
    const { sessionId } = manager.practiceSession;

    return {
      staticContext,
      staticTrace,
      symbol: convertVSCodeSymbol(symbol),
      sessionId
    };
  }
}

// ###########################################################################
// utils
// ###########################################################################

function convertVSCodeSymbol(symbol) {
  if (symbol) {
    return {
      name: symbol.name,
      range: codeRangeToBabelLoc(symbol.range)
    };
  }
  else {
    return null;
  }
}

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

const FunctionSymbolKinds = new Set([
  SymbolKind.Method,
  SymbolKind.Function,
  SymbolKind.Class,
  SymbolKind.Namespace,
  SymbolKind.Module,
  SymbolKind.Constructor,
  SymbolKind.Package
]);

async function getSymbolAt(uri, position) {
  const allSymbols = await commands.executeCommand('vscode.executeDocumentSymbolProvider', uri);

  return findMostInnerSymbol(allSymbols, position);

  function findMostInnerSymbol(symbols, pos) {
    if (!symbols?.length) {
      return null;
    }

    for (const sym of symbols) {
      if (!FunctionSymbolKinds.has(sym.kind)) {
        continue;
      }

      const foundInChildren = findMostInnerSymbol(sym.children, pos);
      if (foundInChildren) {
        return foundInChildren;
      }
      if (sym.range.contains(pos)) {
        return sym;
      }
    }

    return null;
  }
}