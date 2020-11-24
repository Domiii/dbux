
import { commands, SymbolKind, window } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import { newLogger } from '@dbux/common/src/log/logger';
import { emitEditorAction } from '../userEvents';
import { getOrCreateTracesAtCursor } from '../traceDetailsView/TracesAtCursor';
import { codeRangeToBabelLoc } from '../helpers/codeLocHelpers';

/** @typedef {import('@dbux/projects/src/ProjectsManager').default} ProjectsManager */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('codeEvents');

const Verbose = false;
// const Verbose = true;

const defaultNewEventLineThreshold = 8;

/**
 * @param {ProjectsManager} manager 
 */
export function initCodeEvents(manager, context) {
  const traceAtCursor = getOrCreateTracesAtCursor(context);
  let _previousSelectionData, _previousVisibleRangeData;

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
    const firstSelection = e.selections[0];
    let data = {
      file: e.textEditor.document.uri.path,
      range: firstSelection ? codeRangeToBabelLoc(firstSelection) : null
    };

    Verbose && debug('new selection data', data);
    if (isNewData(_previousSelectionData, data)) {
      Verbose && debug('is new');
      _previousSelectionData = data;
      data = { ...data, ...await getExtraEditorEventInfo(e.textEditor) };
      emitEditorAction(UserActionType.EditorSelectionChanged, data);
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
    const firstRange = e.visibleRanges[0];
    let data = {
      file: e.textEditor.document.uri.path,
      range: firstRange ? codeRangeToBabelLoc(firstRange) : null
    };

    Verbose && debug('new range data', data);
    if (isNewData(_previousVisibleRangeData, data)) {
      Verbose && debug('is new');
      _previousVisibleRangeData = data;
      data = { ...data, ...await getExtraEditorEventInfo(e.textEditor) };
      emitEditorAction(UserActionType.EditorVisibleRangeChanged, data);
    }
  });

  // ###########################################################################
  // extra data for code events
  // ###########################################################################

  async function getExtraEditorEventInfo(editor) {
    const trace = traceAtCursor.getMostInner();
    let staticTrace = null;
    let staticContext = null;
    let applicationId = null;
    if (trace) {
      const { staticTraceId } = trace;
      ({ applicationId } = trace);
      const dp = allApplications.getById(applicationId).dataProvider;
      staticTrace = dp.collections.staticTraces.getById(staticTraceId);
      staticContext = dp.collections.staticContexts.getById(staticTrace.staticContextId);
    }
    const symbol = await getSymbolAt(editor.document.uri, editor.selections[0]?.start);
    const { sessionId } = manager.practiceSession;

    return {
      applicationId,
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

function isNewData(previousData, newData) {
  if (previousData?.file !== newData.file) {
    return true;
  }
  if (Math.abs(previousData.range.start.line - newData.range.start.line) >= defaultNewEventLineThreshold) {
    return true;
  }
  if (Math.abs(previousData.range.start.line - newData.range.start.line) >= defaultNewEventLineThreshold) {
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