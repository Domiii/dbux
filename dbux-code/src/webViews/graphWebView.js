import {
  ViewColumn
} from 'vscode';
import GraphHost from '@dbux/graph-host/src/GraphHost';
import { goToTrace } from '../codeUtil/codeNav';
import { getThemeResourcePathUri } from '../resources';
import RichWebView from './RichWebView';

const defaultColumn = ViewColumn.Two;

export default class GraphWebView extends RichWebView {
  constructor() {
    // 'Call Graph'
    super(GraphHost, 'dbux-graph', defaultColumn);
  }

  getIcon() {
    return getThemeResourcePathUri('tree.svg');
  }

  getMainScriptPath() {
    return 'dist/graph.client.js';
  }

  // ###########################################################################
  // provide externals to HostComponentManager
  // ###########################################################################

  externals = {
    async goToTrace(trace) {
      await goToTrace(trace);
    }
  }
}

/**
 * @type {GraphWebView}
 */
let graphWebView;

export async function showGraphView() {
  await initGraphView();
  return graphWebView.show();
}

export function hideGraphView() {
  graphWebView?.hide();
}

export async function initGraphView() {
  if (!graphWebView) {
    graphWebView = new GraphWebView();
    await graphWebView.init();
  }
}