import * as jsPlumbBrowserUI from '@jsplumb/browser-ui';
import { AnchorLocations } from '@jsplumb/common';
import { BezierConnector } from "@jsplumb/connector-bezier";
import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

export default class DDGTimelineView extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div>
      <div data-el="status"></div>
      <div class="timeline-view"></div>
    </div>`);
  }

  setupEl() {
    this.nodeElMap = new Map();
    this.initGraphImplementation();
  }

  update() {
    // update status message
    if (this.state.failureReason) {
      this.els.status.className = 'alert alert-danger';
      this.els.status.textContent = 'Cannot build DataDependencyGraph: ' + this.state.failureReason;
    }
    else {
      this.els.status.textContent = '';
    }

    // TODO: don't rebuild entire graph on every update
    this.rebuildGraph();
  }

  buildGraph() {
    const { nodes, edges } = this.state;

    if (!nodes) {
      return;
    }

    // build nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const el = compileHtmlElement(/*html*/`<div class="timeline-node">
        ${node.label || `Node#${node.entityId}`}
      </div>`);
      el.style.left = '200px';
      el.style.top = `${30 * i}px`;
      this.nodeElMap.set(node.entityId, el);
      this.el.appendChild(el);
      // instance.addEndpoint(el, { endpoint: DotEndpoint.type });

      this.addNode(el);
    }

    if (edges) {
      // add edges
      // console.log('BezierConnector.type', BezierConnector.type);
      for (const edge of edges) {
        const from = this.nodeElMap.get(edge.from);
        const to = this.nodeElMap.get(edge.to);

        this.addEdge(from, to);
      }
    }
  }

  /** ###########################################################################
   * graph implementation
   * NOTE: we might want to replace `jsPlumb` with another library, so let's keep `jsPlumb` code together.
   * ##########################################################################*/

  initGraphImplementation() {
    this.jsPlumb = jsPlumbBrowserUI.newInstance({
      container: this.el
    });
  }

  rebuildGraph() {
    this.jsPlumb.batch(() => {
      this.clearGraph();
      this.buildGraph();
    });
  }

  addNode(el) {
    this.jsPlumb.manage(el);
  }

  addEdge(source, target) {
    this.jsPlumb.connect({
      source,
      target,
      /**
       * @see https://docs.jsplumbtoolkit.com/community/lib/connectivity#detaching-connections
       */
      detachable: false,
      /**
       * @see https://docs.jsplumbtoolkit.com/community/lib/endpoints#endpoint-types
       */
      endpoints: ['Blank', 'Blank'],
      connector: {
        /**
         * @see https://docs.jsplumbtoolkit.com/community/lib/connectors#bezier-connector
         * @see https://docs.jsplumbtoolkit.com/community/apidocs/connector-bezier
         */
        type: BezierConnector.type,
        /**
         * hackfix: always provide `options`, or it will bug out.
         * @see https://github.com/jsplumb/jsplumb/issues/1129
         */
        options: {
          /**
           * default = 150
           */
          curviness: 20
        }
      },
      anchor: AnchorLocations.AutoDefault
    });
  }

  clearGraph() {
    for (const node of this.nodeElMap.values()) {
      this.jsPlumb.remove(node);
    }
    this.nodeElMap = new Map();
  }
}
