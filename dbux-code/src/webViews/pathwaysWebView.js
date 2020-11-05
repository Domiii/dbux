import {
  ViewColumn
} from 'vscode';
import PathwaysHost from '@dbux/graph-host/src/PathwaysHost';
import { goToTrace } from '../codeUtil/codeNav';
import { getOrCreateProjectManager } from '../projectViews/projectControl';
import { getThemeResourcePathUri } from '../resources';
import RichWebView from './RichWebView';
import { decorateVisitedTraces, stopDecorating } from './pathwaysDecorations';

const defaultColumn = ViewColumn.Two;

export default class PathwaysWebView extends RichWebView {
  constructor() {
    // 'Call Graph'
    super(PathwaysHost, 'dbux-pathways', defaultColumn);
  }

  get pdp() {
    return getOrCreateProjectManager().pdp;
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
    onPracticeSessionStateChanged(cb) {
      return getOrCreateProjectManager().onPracticeSessionStateChanged(cb);
    },
    getPathwaysDataProvider: () => this.pdp,

    decorateVisitedTraces: async () => {
      await decorateVisitedTraces(this.pdp);
    },
    stopDecorating: async () => {
      await stopDecorating();
    },
  }
}

/**
 * @type {PathwaysWebView}
 */
let pathwaysWebView;

export async function showPathwaysView() {
  await initPathwaysView();
  return pathwaysWebView.show();
}

export function hidePathwaysView() {
  pathwaysWebView?.hide();
}

export async function initPathwaysView() {
  if (!pathwaysWebView) {
    pathwaysWebView = new PathwaysWebView();
    await pathwaysWebView.init();
  }
}