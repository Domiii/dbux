import GraphWebView from './GraphWebView';

let graphHost;

/**
 * 
 */
export async function showGraphView(context) {
  if (!graphHost) {
    graphHost = new GraphWebView(context);
  }
  return graphHost.show();
}
