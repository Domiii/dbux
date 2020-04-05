import GraphViewHost from './GraphViewHost';

let graphHost;

/**
 * 
 */
export async function showGraphView(context) {
  if (!graphHost) {
    graphHost = new GraphViewHost(context);
  }
  graphHost.show();
}
