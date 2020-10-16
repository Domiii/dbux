import {
  ViewColumn
} from 'vscode';
import PathwaysHost from '@dbux/graph-host/src/PathwaysHost';
import { goToTrace } from '../codeUtil/codeNav';
import { getOrCreateProjectManager } from '../projectViews/projectControl';
import { getThemeResourcePathUri } from '../resources';
import RichWebView from './RichWebView';

const defaultColumn = ViewColumn.Two;

export default class PathwaysWebView extends RichWebView {
  constructor() {
    // 'Call Graph'
    super(PathwaysHost, 'dbux-pathways', defaultColumn);
  }

  getIcon() {
    // return getThemeResourcePathUri('tree.svg');
    return '';
  }

  getMainScriptPath() {
    return 'dist/web/pathways.client.js';
  }

  // ###########################################################################
  // provide externals to HostComponentManager
  // ###########################################################################

  externals = {
    async goToTrace(trace) {
      await goToTrace(trace);
    },
    onPracticeSessionChanged(cb) {
      return getOrCreateProjectManager().onPracticeSessionChanged(cb);
    },
    getPathwaysDataProvider: () => getOrCreateProjectManager().pdp
  }
}

/**
 * @type {pathwaysWebView}
 */
let pathwaysWebView;

export async function showPathwaysView() {
  initPathwaysView();
  return pathwaysWebView.show();
}

export function hidePathwaysView() {
  pathwaysWebView?.hide();
}

export async function initPathwaysView() {
  if (!pathwaysWebView) {
    pathwaysWebView = new PathwaysWebView();
    pathwaysWebView.init();

    // show initially
    pathwaysWebView.show();
  }
}