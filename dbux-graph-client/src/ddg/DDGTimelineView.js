import * as jsPlumbBrowserUI from '@jsplumb/browser-ui';
import { AnchorLocations } from '@jsplumb/common';
import { BezierConnector } from '@jsplumb/connector-bezier';

// import minBy from 'lodash/minBy';
// import maxBy from 'lodash/maxBy';
// import Graph from 'graphology';
// import forceLayout from 'graphology-layout-force';
// import forceAtlas2 from 'graphology-layout-forceatlas2';
// import { Sigma } from 'sigma';
// import { animateNodes } from 'sigma/utils/animate';
// import LayoutAlgorithmType from '@dbux/graph-common/src/ddg/types/LayoutAlgorithmType';
import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

// const AutoLayoutAnimationDuration = 300;
// const labelSize = 24;
const GraphScale = 50;
const XPadding = 30;
const YPadding = 30;

/**
 * Default render settings for Sigma.js
 * @see https://github.com/jacomyal/sigma.js/blob/main/src/settings.ts#L84
 */
// const renderSettings = {
//   labelColor: { color: '#fff' },
//   labelSize,
//   edgeLabelSize: labelSize,
//   labelRenderedSizeThreshold: 0.1 // default = 6
// };

const topNodeKey = 'top';
const bottomNodeKey = 'bottom';

export default class DDGTimelineView extends ClientComponentEndpoint {
  // /**
  //  * @type {Graph}
  //  */
  // graph;

  // /**
  //  * @type {Sigma}
  //  */
  // renderer;

  createEl() {
    return compileHtmlElement(/*html*/`<div class="timeline-view timeline-jsplumb-container">
      <div data-el="status"></div>
      <!-- <div data-el="view" class="timeline-view timeline-sigma-container"></div> -->
      <!-- <div data-el="view" class="timeline-view timeline-jsplumb-container"></div> -->
    </div>`);
  }

  setupEl() {
    this.initGraphImplementation();
  }

  update() {
    // update status message
    if (this.state.failureReason) {
      this.els.status.classList.add('alert', 'alert-danger');
      // this.els.status.className = 'alert alert-danger';
      this.els.status.textContent = 'Cannot build DataDependencyGraph: ' + this.state.failureReason;
    }
    else {
      this.els.status.classList.remove('alert', 'alert-danger');
      this.els.status.textContent = '';
    }

    // TODO: don't rebuild entire graph on every update
    this.rebuildGraph();
  }

  /** ###########################################################################
   * buildGraph
   * ##########################################################################*/

  buildGraph() {
    const { nodes, edges } = this.state;

    if (!nodes?.length) {
      return;
    }

    this.addSpecialNodes();

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
          // add to bottom
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

  /** ###########################################################################
   * layout computation
   * ##########################################################################*/

  getNodeYTop() {
    // return YPadding + (this.state.nodes.length + 1) * GraphScale;
    return YPadding + 0;
  }

  getNodeYBottom() {
    // return YPadding - this.state.nodes.length * GraphScale;
    return YPadding + (this.state.nodes.length + 1) * GraphScale;
  }

  getNodeInitialPosition(node) {
    /**
     * WARNING: auto layout using `ForceAtlas` algorithm fails if all nodes starts with `x=0 and y=0`
     * @see https://graphology.github.io/standard-library/layout-forceatlas2.html#pre-requisites
     */
    // const x = node.ddgNodeId / this.state.nodes.length;
    const x = XPadding + Math.random() * this.state.nodes.length * GraphScale;

    /**
     * WARNING: if you change this, also change getNodeY{Top,Bottom}
     */
    // const y = YPadding + ((-1 * node.ddgNodeId + this.state.nodes.length) || 0) * GraphScale;
    const y = YPadding + (node.ddgNodeId + 1 || 0) * GraphScale;
    return { x, y };
  }

  /** ###########################################################################
   * Sigma.js implementation
   *  #########################################################################*/

  /** ########################################
   * abstract functions implementation
   *  ######################################*/

  // initGraphImplementation() {
  //   this.graph = new Graph();
  //   // this.graph.
  //   this.renderer = new Sigma(this.graph, this.el, renderSettings);
  //   // test
  //   // document.addEventListener('click', this.applyLayout.bind(this));
  // }

  // rebuildGraph() {
  //   this.clearGraph();
  //   this.buildGraph();
  // }

  // addNode(node) {
  //   const label = node.label || `Node#${node.ddgNodeId}`;
  //   const pos = this.getNodeInitialPosition(node);
  //   const { x, y } = pos;
  //   /**
  //    * @type {NodeDisplayData}
  //    */
  //   const nodeDisplayData = {
  //     x,
  //     y,
  //     label,

  //     size: 5,
  //     color: "blue"
  //   };
  //   return this.addNodeLayout(node.ddgNodeId, nodeDisplayData);
  // }

  // addSpecialNodes() {
  //   // add special nodes at the top and bottom
  //   this.addNodeLayout(topNodeKey, {
  //     x: 0,
  //     y: this.getNodeYTop(),
  //     fixed: true,

  //     // hidden: true
  //     label: 'top',
  //     size: 5,
  //     color: "green"
  //   });
  //   this.addNodeLayout(bottomNodeKey, {
  //     x: 0,
  //     y: this.getNodeYBottom(),
  //     fixed: true,

  //     // hidden: true
  //     label: 'bottom',
  //     size: 5,
  //     color: "red"
  //   });
  // }

  // addEdge(edge) {
  //   /**
  //    * `code ./node_modules/graphology/dist/graphology.esm.js:3691`
  //    */
  //   this.graph.addEdge(edge.from, edge.to);
  // }

  // /**
  //  * Insert a raw node into the graph (for layouting + rendering purposes)
  //  * @param {{ x: number, y: number, fixed, hidden, size, color }} nodeDisplayData
  //  */
  // addNodeLayout(key, nodeDisplayData) {
  //   return this.graph.addNode(key, nodeDisplayData);
  // }

  // /**
  //  * @return {NodeDisplayData}
  //  */
  // getNodeDisplayData(nodeKey) {
  //   // see graphology → `findRelevantNodeData` (via `attachNodeAttributesMethods`)
  //   return this.graph.getNodeAttribute(nodeKey/* , 'defaultPosition' */);
  // }

  // clearGraph() {
  //   this.graph.clear();
  // }

  /** ########################################
   * auto layout
   *  ######################################*/

  // applyForceLayout() {
  //   // set initial state using FA2
  //   this.applyFA2();

  //   // run standard force-directed algorithm here
  //   const layoutSettings = {
  //     maxIterations: 500,
  //     /**
  //      * @see https://graphology.github.io/standard-library/layout-force.html
  //      */
  //     settings: {
  //       gravity: 0.01, // NOTE: if gravity is too large, nodes will move beyond top and bottom
  //       repulsion: 0.1,
  //       attraction: 0.001
  //     }
  //   };
  //   // this.logger.log('layoutSettings', layoutSettings);
  //   const positions = forceLayout(this.graph, layoutSettings);
  //   // const rescaledPositions = rescalePositions(positions);
  //   this.logger.log('[force layout] positions', positions);
  //   animateNodes(this.graph, positions, { duration: AutoLayoutAnimationDuration });
  // }

  // applyFA2() {
  //   const sensibleSettings = forceAtlas2.inferSettings(this.graph);
  //   sensibleSettings.gravity = 1;
  //   sensibleSettings.strongGravityMode = false;
  //   this.logger.log('[FA2] sensibleSettings', sensibleSettings);
  //   // const positions = forceAtlas2(this.graph, {
  //   forceAtlas2.assign(this.graph, {
  //     iterations: 200,
  //     settings: sensibleSettings
  //   });

  //   // // overwrite with our default `y`
  //   // for (const nodeId of Object.keys(positions)) {
  //   //   // see graphology → `findRelevantNodeData`
  //   //   const { y } = this.graph.getNodeAttribute(nodeId, 'defaultPosition');
  //   //   positions[nodeId].y = y;
  //   // }

  //   // const rescaledPositions = rescalePositions(positions);
  //   // this.logger.log('positions', rescaledPositions);

  //   // animateNodes(this.graph, positions, { duration: AutoLayoutAnimationDuration });
  // }

  // autoLayout = () => {
  //   const { layoutType } = this.context.doc.state;
  //   if (layoutType === LayoutAlgorithmType.ForceLayout) {
  //     this.applyForceLayout();
  //   }
  //   else if (layoutType === LayoutAlgorithmType.ForceAtlas2) {
  //     this.applyFA2();
  //   }
  //   else {
  //     this.logger.error(`Unkown layout algorithm type: ${layoutType}`);
  //   }
  // }

  /** ###########################################################################
   * jsPlumb implementation
   *  #########################################################################*/

  initGraphImplementation() {
    this.nodeElMap = new Map();
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

  addSpecialNodes() {
    this.addNodeLayout(topNodeKey, {
      label: 'top',
      x: XPadding,
      y: this.getNodeYTop(),
    });

    this.addNodeLayout(bottomNodeKey, {
      label: 'buttom',
      x: XPadding,
      y: this.getNodeYBottom(),
    });
  }

  addNodeDefault(node) {
    const {
      ddgNodeId,
      label = `Node#${ddgNodeId}`,
    } = node;

    const { x, y } = this.getNodeInitialPosition(node);

    this.addNodeLayout(ddgNodeId, { label, x, y });
  }

  addNodeLayout(key, nodeDisplayData) {
    const { x, y, label } = nodeDisplayData;
    const el = compileHtmlElement(/*html*/`<div class="timeline-node">
        ${label}
      </div>`);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    this.nodeElMap.set(key, el);
    this.el.appendChild(el);
    this.jsPlumb.manage(el);
  }

  addEdge(edge) {
    const source = this.nodeElMap.get(edge.from);
    const target = this.nodeElMap.get(edge.to);
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
      overlays: [
        {
          type: 'PlainArrow',
          options: {
            location: 1,
            width: 8,
            length: 8,
          }
        },
      ],
      anchor: AnchorLocations.AutoDefault
    });
  }

  clearGraph() {
    this.jsPlumb.deleteEveryConnection();
    for (const el of this.nodeElMap.values()) {
      this.el.removeChild(el);
    }
    this.nodeElMap = new Map();
  }

  /** ###########################################################################
   * misc
   * ##########################################################################*/

  public = {
    // autoLayout: this.autoLayout
  };
}


/** ###########################################################################
 * util
 *  #########################################################################*/

// function rescalePositions(positions) {
//   if (!positions || !Object.keys(positions).length) {
//     return positions;
//   }

//   const minX = minBy(Object.values(positions), (p) => p.x).x;
//   const maxX = maxBy(Object.values(positions), (p) => p.x).x;
//   const minY = minBy(Object.values(positions), (p) => p.y).y;
//   const maxY = maxBy(Object.values(positions), (p) => p.y).y;
//   const deltaX = maxX - minX;
//   const deltaY = maxY - minY;
//   for (const ddgNodeId of Object.keys(positions)) {
//     positions[ddgNodeId].x /= deltaX;
//     positions[ddgNodeId].y /= deltaY;
//   }
//   return positions;
// }
