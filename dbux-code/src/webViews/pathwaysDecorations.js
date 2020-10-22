import EmptyArray from '@dbux/common/src/util/EmptyArray';
// import allApplications from '@dbux/data/src/applications/allApplications';
import { showTextDocument } from '../codeUtil/codeNav';
import codeDecorations, { CodeDecoRegistration } from '../codeDeco/codeDecorations';
import { babelLocToCodeRange } from '../helpers/codeLocHelpers';

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
    const decos = staticTraces?.map(staticTrace => {
      const { loc } = staticTrace;
      return {
        range: babelLocToCodeRange(loc)
      };
    }) || EmptyArray;
    
    
    const editor = await showTextDocument(fpath);
    visitedStaticTracesRegistration.setDecos(editor, decos);
  }
}