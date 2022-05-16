// import * as jsPlumbBrowserUI from '@jsplumb/browser-ui';
// import { AnchorLocations } from '@jsplumb/common';
// import { BezierConnector } from '@jsplumb/connector-bezier';

import minBy from 'lodash/minBy';
import maxBy from 'lodash/maxBy';
import Graph from 'graphology';
import forceLayout from 'graphology-layout-force';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import Sigma from 'sigma';
import { animateNodes } from 'sigma/utils/animate';
import LayoutAlgorithmType from '@dbux/graph-common/src/ddg/types/LayoutAlgorithmType';
import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

const AutoLayoutAnimationDuration = 300;

export default class DDGTimelineView extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div>
      <div data-el="status"></div>
      <div data-el="view" class="timeline-view timeline-sigma-container"></div>
    </div>`);
  }

  setupEl() {
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

    // add nodes
    for (const node of nodes) {
      this.addNode(node);
    }

    if (edges) {
      // add edges
      // console.log('BezierConnector.type', BezierConnector.type);
      for (const edge of edges) {
        this.addEdge(edge);
      }
    }
  }

  /** ###########################################################################
   * graph implementation
   * NOTE: we might want to replace `jsPlumb` with another library, so let's keep `jsPlumb` code together.
   * ##########################################################################*/

  /** ########################################
   * sigma.js version
   *  ######################################*/

  initGraphImplementation() {
    this.graph = new Graph();
    this.renderer = new Sigma(this.graph, this.els.view);

    // test
    // document.addEventListener('click', this.applyLayout.bind(this));
  }

  rebuildGraph() {
    this.clearGraph();
    this.buildGraph();

    this.autoLayout();
  }

  addNode(node) {
    const label = node.label || `Node#${node.entityId}`;
    const defaultPosition = this.getNodeDefaultPosition(node);
    const { x, y } = defaultPosition;
    this.graph.addNode(node.entityId, { x, y, size: 5, label, color: "blue", defaultPosition });
  }

  addEdge(edge) {
    this.graph.addEdge(edge.from, edge.to);
  }

  clearGraph() {
    this.graph.clear();
  }

  getNodeDefaultPosition(node) {
    /**
     * WARNING: auto layout using `ForceAtlas` algorithm fails if all nodes starts with `x=0 and y=0`
     * @see https://graphology.github.io/standard-library/layout-forceatlas2.html#pre-requisites
     */
    const x = Math.random();
    const y = node.ddgNodeId;
    return { x, y };
  }

  applyForceLayout() {
    const layoutSettings = {
      maxIterations: 500,
      settings: {
        gravity: 0.001,
        repulsion: 0.01,
        attraction: 0.01
      }
    };
    this.logger.log('layoutSettings', layoutSettings);
    const positions = forceLayout(this.graph, layoutSettings);
    const rescaledPositions = rescalePositions(positions);
    // this.logger.log('positions', rescaledPositions);
    animateNodes(this.graph, rescaledPositions, { duration: AutoLayoutAnimationDuration });
  }

  applyFA2() {
    const sensibleSettings = forceAtlas2.inferSettings(this.graph);
    sensibleSettings.gravity = 10;
    sensibleSettings.strongGravityMode = false;
    this.logger.log('sensibleSettings', sensibleSettings);
    const positions = forceAtlas2(this.graph, {
      iterations: 200,
      settings: sensibleSettings
    });

    // overwrite with our default `y`
    for (const entityId of Object.keys(positions)) {
      const { y } = this.graph.getNodeAttribute(entityId, 'defaultPosition');
      positions[entityId].y = y;
    }

    const rescaledPositions = rescalePositions(positions);
    // this.logger.log('positions', rescaledPositions);
    animateNodes(this.graph, rescaledPositions, { duration: AutoLayoutAnimationDuration });
  }

  autoLayout() {
    const { layoutType } = this.context.doc.state;
    if (layoutType === LayoutAlgorithmType.ForceLayout) {
      this.applyForceLayout();
    }
    else if (layoutType === LayoutAlgorithmType.ForceAtlas2) {
      this.applyFA2();
    }
    else {
      this.logger.error(`Unkown layout algotirhm type: ${layoutType}`);
    }
  }

  /** ########################################
   * jsPlumb version
   *  ######################################*/

  // initGraphImplementation() {
  //   this.nodeElMap = new Map();
  //   this.jsPlumb = jsPlumbBrowserUI.newInstance({
  //     container: this.el
  //   });
  // }

  // rebuildGraph() {
  //   this.jsPlumb.batch(() => {
  //     this.clearGraph();
  //     this.buildGraph();
  //   });
  // }

  // addNode(node, i) {
  //   const el = compileHtmlElement(/*html*/`<div class="timeline-node">
  //     ${node.label || `Node#${node.entityId}`}
  //   </div>`);
  //   el.style.left = '200px';
  //   el.style.top = `${30 * i}px`;
  //   this.nodeElMap.set(node.entityId, el);
  //   this.el.appendChild(el);
  //   // instance.addEndpoint(el, { endpoint: DotEndpoint.type });
  //   this.jsPlumb.manage(el);
  // }

  // addEdge(edge) {
  //   const source = this.nodeElMap.get(edge.from);
  //   const target = this.nodeElMap.get(edge.to);
  //   this.jsPlumb.connect({
  //     source,
  //     target,
  //     /**
  //      * @see https://docs.jsplumbtoolkit.com/community/lib/connectivity#detaching-connections
  //      */
  //     detachable: false,
  //     /**
  //      * @see https://docs.jsplumbtoolkit.com/community/lib/endpoints#endpoint-types
  //      */
  //     endpoints: ['Blank', 'Blank'],
  //     connector: {
  //       /**
  //        * @see https://docs.jsplumbtoolkit.com/community/lib/connectors#bezier-connector
  //        * @see https://docs.jsplumbtoolkit.com/community/apidocs/connector-bezier
  //        */
  //       type: BezierConnector.type,
  //       /**
  //        * hackfix: always provide `options`, or it will bug out.
  //        * @see https://github.com/jsplumb/jsplumb/issues/1129
  //        */
  //       options: {
  //         /**
  //          * default = 150
  //          */
  //         curviness: 20
  //       }
  //     },
  //     anchor: AnchorLocations.AutoDefault
  //   });
  // }

  // clearGraph() {
  //   for (const node of this.nodeElMap.values()) {
  //     this.jsPlumb.remove(node);
  //   }
  //   this.nodeElMap = new Map();
  // }
}


/** ###########################################################################
 * util
 *  #########################################################################*/

function rescalePositions(positions) {
  if (!positions || !Object.keys(positions).length) {
    return positions;
  }

  const minX = minBy(Object.values(positions), (p) => p.x).x;
  const maxX = maxBy(Object.values(positions), (p) => p.x).x;
  const minY = minBy(Object.values(positions), (p) => p.y).y;
  const maxY = maxBy(Object.values(positions), (p) => p.y).y;
  const deltaX = maxX - minX;
  const deltaY = maxY - minY;
  for (const entityId of Object.keys(positions)) {
    positions[entityId].x /= deltaX;
    positions[entityId].y /= deltaY;
  }
  return positions;
}
