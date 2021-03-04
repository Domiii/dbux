import EmptyArray from '@dbux/common/src/util/EmptyArray';
// import allApplications from '@dbux/data/src/applications/allApplications';
import { newLogger } from '@dbux/common/src/log/logger';
import { showTextDocument } from '../codeUtil/codeNav';
import codeDecorations, { CodeDecoRegistration } from '../codeDeco/codeDecorations';
import { babelLocToCodeRange } from '../helpers/codeLocHelpers';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('PathwaysDecorations');

let visitedStaticTracesRegistration;

/**
 * @see https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions
 */
const visitedDecoType = {
  /**
   * hackfix
   * @see https://stackoverflow.com/questions/42973213/vs-code-decorator-extension-above-below-specified-range
   */
  textDecoration: 'none; background-color: rgba(255, 153, 0, 0.3);', // gold

  // border: '1px solid yellow'
};

export async function stopDecorating() {
  visitedStaticTracesRegistration?.unsetDeco();
}

/**
 * Decorate all user-visited staticTraces.
 * 
 * TODO: Need to cut entire `context`s out of decorated `staticTrace` locs.
 */
export async function decorateVisitedTraces(pdp) {
  if (!visitedStaticTracesRegistration) {
    visitedStaticTracesRegistration = codeDecorations.registerDeco(visitedDecoType);
  }

  const staticTracesByFile = pdp.util.getVisitedStaticTraces();
  for (const [fpath, staticTraces] of staticTracesByFile.entries()) {
    // sanity check, staticTraces should always be a Set(not `undefined`)
    if (!staticTraces) {
      logError(`Got falsy value from set-valued index`);
      return;
    }
    
    const decos = Array.from(staticTraces).map(staticTrace => {
      const { loc } = staticTrace;
      return {
        range: babelLocToCodeRange(loc)
      };
    });
    
    const editor = await showTextDocument(fpath);
    visitedStaticTracesRegistration.setDecos(editor, decos);
  }
}