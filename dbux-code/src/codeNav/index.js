import {
  window,
  Uri,
  Position,
  Selection
} from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import Loc from 'dbux-common/src/core/data/Loc';
import applicationCollection from 'dbux-data/src/applicationCollection';
import { babelLocToCodeRange } from '../helpers/locHelper';
import codeDecorations from '../codeDeco/codeDecorations';


const { log, debug, warn, error: logError } = newLogger('CodeNav');

/**
 * @param {Uri} URI (new vscode.Uri.file(FILEPATH))
 * @param {Position} position (new vscode.Position(LINE, CHARACTER))
 */
export function goToCodeLoc(URI: Uri, loc: Loc) {
  window.showTextDocument(URI).then(editor => {
    const range = babelLocToCodeRange(loc);
    editor.selection = new Selection(range.start, range.end);
    editor.revealRange(range);
  });
}

// TODO: clean up `selectedTrace*` stuff and integrate with playback feature
const selectedTraceDecoType = {
  border: '1px solid red'
};
let selectedTraceRegistration: CodeDecoRegistration;
function _selectTrace(loc) {
  if (!selectedTraceRegistration) {
    selectedTraceRegistration = codeDecorations.registerDeco(selectedTraceDecoType);
  }
  selectedTraceRegistration.setDeco(window.activeTextEditor, {
    range: babelLocToCodeRange(loc)
  });
}


export function goToTrace(trace) {
  const dp = applicationCollection.getApplication(trace.applicationId).dataProvider;
  const { staticTraceId } = dp.collections.traces.getById(trace.traceId);
  const { loc } = dp.collections.staticTraces.getById(staticTraceId);
  const filePath = dp.queries.programFilePathByTraceId(trace.traceId);

  goToCodeLoc(Uri.file(filePath), loc);

  _selectTrace(loc);
}