import {
  ViewColumn
} from 'vscode';
import GraphHost from '@dbux/graph-host/src/GraphHost';
import { getThemeResourcePathUri } from '../codeUtil/codePath';
import RichWebView from './RichWebView';
import { emitCallGraphAction } from '../userEvents';

const defaultColumn = ViewColumn.Two;

export default class GraphWebView extends RichWebView {
  constructor() {
    super(GraphHost, 'dbux-graph', defaultColumn);
  }

  getIcon() {
    return getThemeResourcePathUri('tree.svg');
  }

  getMainScriptPath() {
    return 'dist/web/graph.client.js';
  }

  // ###########################################################################
  // provide externals to HostComponentManager
  // ###########################################################################

  externals = {
    emitCallGraphAction
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