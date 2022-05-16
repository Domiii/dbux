// import * as jsPlumbBrowserUI from '@jsplumb/browser-ui';
// import { AnchorLocations } from '@jsplumb/common';
// import { BezierConnector } from '@jsplumb/connector-bezier';

import minBy from 'lodash/minBy';
import maxBy from 'lodash/maxBy';
import Graph from 'graphology';
import forceLayout from 'graphology-layout-force';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { Sigma } from 'sigma';
import { animateNodes } from 'sigma/utils/animate';
import LayoutAlgorithmType from '@dbux/graph-common/src/ddg/types/LayoutAlgorithmType';
import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

const AutoLayoutAnimationDuration = 300;
const labelSize = 24;

/**
 * @see https://github.com/jacomyal/sigma.js/blob/main/src/settings.ts#L84
 */
const renderSettings = {
  labelColor: { color: '#fff' },
  labelSize,
  edgeLabelSize: labelSize,
  labelRenderedSizeThreshold: 1 // default = 6
};

const topNodeKey = 'top';
const bottomNodeKey = 'bottom';


export default class DDGTimelineView extends ClientComponentEndpoint {
  /**
   * @type {Graph}
   */
  graph;

  /**
   * @type {Sigma}
   */
  renderer;

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

  /** ###########################################################################
   * buildGraph
   * ##########################################################################*/

  initGraphImplementation() {
    this.graph = new Graph();
    // this.graph.
    this.renderer = new Sigma(this.graph, this.els.view, renderSettings);
    // test
    // document.addEventListener('click', this.applyLayout.bind(this));
  }

  rebuildGraph() {
    this.clearGraph();
    this.buildGraph();

    this.autoLayout();
  }

  buildGraph() {
    const { nodes, edges } = this.state;

    if (!nodes) {
      return;
    }

    // add special nodes at the top and bottom
    this.addNodeLayout(topNodeKey, {
      x: 0,
      y: this.getNodeYTop(),
      fixed: true,
      // hidden: true
    });
    this.addNodeLayout(bottomNodeKey, {
      x: 0,
      y: this.getNodeYBottom(),
      fixed: true,
      // hidden: true
    });

    // add nodes
    for (const node of nodes) {
      this.addNodeDefault(node);
    }

    if (edges) {
      // add special edges
      const watchedNodes = this.state.nodes.filter(n => n.watched);
      for (const n of watchedNodes) {
        if (!n.nInputs) {
          // add to top
          this.addEdge({
            from: topNodeKey,
            to: n.ddgNodeId
          });
        }
        if (!n.nOutputs) {
          this.addEdge({
            from: n.ddgNodeId,
            to: bottomNodeKey
          });
        }
      }

      // add default edges
      for (const edge of edges) {
        this.addEdge(edge);
      }
    }
  }

  addNodeDefault(node) {
    const label = node.label || `Node#${node.ddgNodeId}`;
    const pos = this.getNodeInitialPosition(node);
    const { x, y } = pos;
    /**
     * @type {NodeDisplayData}
     */
    const nodeDisplayData = {
      x,
      y,
      label,

      size: 5,
      color: "blue"
    };
    return this.addNodeLayout(node.ddgNodeId, nodeDisplayData);
  }

  /**
   * Insert a raw node into the graph (for layouting + rendering purposes)
   * @param {{ x: number, y: number, fixed, hidden, size, color }} props
   */
  addNodeLayout(key, nodeDisplayData) {
    return this.graph.addNode(key, nodeDisplayData);
  }

  addEdge(edge) {
    /**
     * `code ./node_modules/graphology/dist/graphology.esm.js:3691`
     */
    this.graph.addEdge(edge.from, edge.to);
  }

  /**
   * @return {NodeDisplayData}
   */
  getNodeDisplayData(nodeKey) {
    // see graphology → `findRelevantNodeData` (via `attachNodeAttributesMethods`)
    return this.graph.getNodeAttribute(nodeKey/* , 'defaultPosition' */);
  }

  /** ###########################################################################
   * layout computation
   * ##########################################################################*/

  getNodeYTop() {
    return 0;
  }

  getNodeYBottom() {
    return this.state.nodes.length;
  }

  getNodeInitialPosition(node) {
    /**
     * WARNING: auto layout using `ForceAtlas` algorithm fails if all nodes starts with `x=0 and y=0`
     * @see https://graphology.github.io/standard-library/layout-forceatlas2.html#pre-requisites
     */
    const x = node.ddgNodeId;

    /**
     * WARNING: if you change this, also change getNodeY{Top,Bottom}
     */
    const y = node.ddgNodeId;
    return { x, y };
  }

  applyForceLayout() {
    const layoutSettings = {
      maxIterations: 500,
      settings: {
        isNodeFixed(key, node) {
          return node.fixed;
        }
        // gravity: 0.01,
        // repulsion: 0.01,
        // attraction: 0.01
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

    // // overwrite with our default `y`
    // for (const nodeId of Object.keys(positions)) {
    //   // see graphology → `findRelevantNodeData`
    //   const { y } = this.graph.getNodeAttribute(nodeId, 'defaultPosition');
    //   positions[nodeId].y = y;
    // }

    const rescaledPositions = rescalePositions(positions);
    // this.logger.log('positions', rescaledPositions);
    animateNodes(this.graph, rescaledPositions, { duration: AutoLayoutAnimationDuration });
  }

  autoLayout = () => {
    const { layoutType } = this.context.doc.state;
    if (layoutType === LayoutAlgorithmType.ForceLayout) {
      this.applyForceLayout();
    }
    else if (layoutType === LayoutAlgorithmType.ForceAtlas2) {
      this.applyFA2();
    }
    else {
      this.logger.error(`Unkown layout algorithm type: ${layoutType}`);
    }
  }

  /** ###########################################################################
   * misc
   * ##########################################################################*/

  clearGraph() {
    this.graph.clear();
  }

  public = {
    autoLayout: this.autoLayout
  };

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
  for (const ddgNodeId of Object.keys(positions)) {
    positions[ddgNodeId].x /= deltaX;
    positions[ddgNodeId].y /= deltaY;
  }
  return positions;
}
