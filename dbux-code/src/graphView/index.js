import GraphWebView from './GraphWebView';

let graphWebView;

/**
 * 
 */

function initGraphWebView() {
  if (!graphWebView) {
    graphWebView = new GraphWebView();
  }
}

export async function showGraphView() {
  initGraphWebView();
  return graphWebView.show();
}

export function hideGraphView() {
  if (graphWebView) {
    graphWebView.hide();
  }
}

export async function initGraphView() {
  initGraphWebView();
  return graphWebView.init();
}