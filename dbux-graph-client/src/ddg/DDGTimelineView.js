// import * as jsPlumbBrowserUI from '@jsplumb/browser-ui';
// import { AnchorLocations } from '@jsplumb/common';
// import { BezierConnector } from '@jsplumb/connector-bezier';

// import * as d3selection from 'd3-selection';
import { transition as d3transition } from 'd3-transition';
// import { select as d3select } from 'd3-select';
import * as d3Graphviz from 'd3-graphviz';
import isPlainObject from 'lodash/isPlainObject';

import { PrettyTimer } from '@dbux/common/src/util/timeUtil';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { PDGRootTimelineId } from '@dbux/data/src/pdg/constants';
import PDGSummaryMode, { GroupDefaultSummaryModes } from '@dbux/data/src/pdg/PDGSummaryMode';
import pdgQueries, { RenderState } from '@dbux/data/src/pdg/pdgQueries';
import DotBuilder from '@dbux/data/src/pdg/DotBuilder';
import PDGTimelineNodeType, { isControlGroupTimelineNode } from '@dbux/common/src/types/constants/PDGTimelineNodeType';
import { makeStructuredRandomColor } from '@dbux/graph-common/src/shared/contextUtil';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { PDGTimelineNode } from '@dbux/data/src/pdg/PDGTimelineNodes';
import { compileHtmlElement } from '../util/domUtil';
import { updateElDecorations, makeSummaryButtons, makeSummaryLabelSvgCompiled } from './pdgDomUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

// const AutoLayoutAnimationDuration = 300;
// const labelSize = 24;

// const XPadding = 30;
// const YPadding = 30;
// const XGap = 8;
// const YGap = 15;
// const YGroupPadding = 4;

const NodeMenuHeight = 12;
const NodeMenuYOffset = 4;
// const NodeHeight = 20;
// const NodeWidth = 40;


let documentMouseMoveHandler;


function getElTopOffset(el) {
  const s = getComputedStyle(el, null);
  const b = parseFloat(s.getPropertyValue('border-top-width')) || 0;
  const m = parseFloat(s.getPropertyValue('margin-top-width')) || 0;
  return b + m;
}

function getElLeftOffset(el) {
  const s = getComputedStyle(el, null);
  const b = parseFloat(s.getPropertyValue('border-left-width')) || 0;
  const m = parseFloat(s.getPropertyValue('margin-left-width')) || 0;
  return b + m;
}

/**
 * @see https://github.com/magjac/d3-graphviz#supported-options
 */
const GraphVizCfg = {
  /**
   * Performance tweaks.
   * @see https://github.com/magjac/d3-graphviz/issues/232#issuecomment-1156834744
   * @see https://github.com/magjac/d3-graphviz#performance
   * @see https://github.com/magjac/d3-graphviz#graphviz_tweenShapes
   */
  tweenShapes: false,
  tweenPaths: false,
  // tweenPrecision: 100, // NOTE: not necessary when tweening is disabled
  // convertEqualSidedPolygons: false // NOTE: not necessary when `tweenShapes` is disabled
};

const RenderCfg = {
  // NOTE: also sync with css class
  edgeHighlightDelay: 5000,
  edgeHighlightFadeoutClass: 'fadeout-5',
  highlightColorCfg: {
    sat: 100
  },
  forceReinitGraphviz: false,
  // forceReinitGraphviz: true,
  debugViewEnabled: true
};

/** ###########################################################################
 * util
 * ##########################################################################*/
// /**
//   * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
//   * 
//   * @param {String} text The text to be rendered.
//   * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
//   * 
//   * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
//   */
// function getTextWidth(text, font) {
//   // re-use canvas object for better performance
//   const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
//   const context = canvas.getContext("2d");
//   context.font = font;
//   const metrics = context.measureText(text);
//   return metrics.width;
// }

// function getTextWidthEl(el) {
//   return getTextWidth(el.textContent, getCanvasFontSize(el));
// }

// function getCssStyle(element, prop) {
//   return window.getComputedStyle(element, null).getPropertyValue(prop);
// }

// function getCanvasFontSize(el = document.body) {
//   const fontWeight = getCssStyle(el, 'font-weight') || 'normal';
//   const fontSize = getCssStyle(el, 'font-size') || '16px';
//   const fontFamily = getCssStyle(el, 'font-family') || 'Times New Roman';

//   return `${fontWeight} ${fontSize} ${fontFamily}`;
// }

/** ###########################################################################
 * NodeHoverState
 *  #########################################################################*/

class NodeHoverState {
  node;
  hoverEl;
  /**
   * @type {PDGTimelineView}
   */
  timeline;

  /**
   * @type {Element[]}
   */
  edgeEls;
  /**
   * @type {Element[]}
   */
  fakeEdgeEls;

  constructor(timeline, node, hoverEl) {
    this.timeline = timeline;
    this.node = node;
    this.hoverEl = hoverEl;

    this.startHoverState();
  }

  startHoverState() {
    this.#startHighlight();
  }

  stopHoverState() {
    this.hoverEl.remove();
    this.#stopHighlight();
  }

  /** ###########################################################################
   * edge highlighting
   *  #########################################################################*/

  #getAllEdges(timelineId) {
    const {
      timeline: {
        pdg: {
          inEdgesByTimelineId,
          outEdgesByTimelineId
        }
      }
    } = this;

    const allEdgeIds = [
      ...inEdgesByTimelineId[timelineId] || EmptyArray,
      ...outEdgesByTimelineId[timelineId] || EmptyArray,
    ];
    return allEdgeIds;
  }

  #startHighlight() {
    const {
      node: {
        timelineId,
        children
      }
    } = this;
    const {
      themeMode
    } = this.timeline.context;

    const allEdgeIds = [
      timelineId,
      ...Object.values(children || EmptyObject)
    ]
      .filter(Boolean)
      .flatMap(id => this.#getAllEdges(id));

    /* allEdgeIds.map(edgeId => edges[edgeId]) */
    this.edgeEls = allEdgeIds
      .map(edgeId => this.timeline.el.querySelector(`#e${edgeId}`))
      .filter(Boolean); // NOTE: some edges might be gone or invisible... or is it a race condition?
    this.fakeEdgeEls = this.edgeEls
      .map((edgeEl, i) => {
        const edgeId = allEdgeIds[i];

        /**
         * @type {Element}
         */
        let fakeEl = this.timeline.el.querySelector(`.fake-edge-${edgeId}`);
        if (fakeEl) {
          // console.debug('fakeEl already existed');
          // fake edge already exists → refresh it
          fakeEl.classList.remove(RenderCfg.edgeHighlightFadeoutClass);
        }
        else {
          // create new fake edge
          fakeEl = edgeEl.cloneNode();
          fakeEl.innerHTML = edgeEl.innerHTML; // NOTE: cloneNode is shallow
          fakeEl.setAttribute('id', ''); // unset id
          fakeEl.classList.add(`fake-edge`);
          fakeEl.classList.add(`fake-edge-${edgeId}`);
          fakeEl.addEventListener('animationend', (e) => {
            if (e.animationName === 'fadeout') {
              // console.debug(`Fake edge fadeout: ${edgeId}`, e);
              fakeEl.remove();
            }
          });

          this.timeline.registerDeco(fakeEl);

          // update all colors
          const col = makeStructuredRandomColor(themeMode, edgeId % 50, { sat: 100, start: Math.round(edgeId / 50) * 30 });
          fakeEl.querySelectorAll('path,polygon').forEach(el => {
            el.setAttribute('stroke', col);
            el.setAttribute('stroke-width', 5);
          });
          // edgeEl.parentElement.insertBefore(fakeEl, edgeEl.nextSibling);
          edgeEl.parentElement.appendChild(fakeEl); // move to end, so its on top
        }
        return fakeEl;
      });
  }

  #stopHighlight() {
    // play fade out animation
    this.fakeEdgeEls.forEach((el) => {
      el.classList.add(RenderCfg.edgeHighlightFadeoutClass);
      // setTimeout(
      //   () => {
      //     el.remove(); // delete fake el afterward
      //   },
      //   RenderCfg.edgeHighlightDelay);
    });
  }
}

/** ###########################################################################
 * {@link PDGTimelineView}
 *  #########################################################################*/

export default class PDGTimelineView extends ClientComponentEndpoint {
  /**
   * @type {NodeHoverState}
   */
  currentHoverState;

  get doc() {
    return this.context.doc;
  }

  createEl() {
    return compileHtmlElement(/*html*/`<div id="pdg-timeline" class="timeline-view">
      <div data-el="status"></div>
      <div data-el="graphcont" class="graph-cont">
      </div>
      <!-- <div data-el="view" class="timeline-view timeline-sigma-container"></div> -->
      <!-- <div data-el="view" class="timeline-view timeline-jsplumb-container"></div> -->
    </div>`);
  }

  setupEl() {
    // delegate(this.el, 'div.timeline-node', 'click', async (nodeEl) => {
    //   const timelineId = parseInt(nodeEl.dataset.timelineId, 10);
    //   if (timelineId) {
    //     const node = this.renderState.timelineNodes[timelineId];
    //     if (node.dataNodeId) {
    //       await this.remote.selectNode(timelineId);
    //     }
    //   }
    // });

    this.refreshGraph();
  }

  update() {
    this.refreshGraph();
  }

  refreshGraph() {
    const { failureReason } = this.renderState;
    // update status message
    if (failureReason) {
      this.els.status.classList.add('alert', 'alert-danger');
      // this.els.status.className = 'alert alert-danger';
      this.els.status.textContent = 'Cannot build DataDependencyGraph: ' + failureReason;
    }
    else {
      this.els.status.classList.remove('alert', 'alert-danger');
      this.els.status.textContent = '';
    }

    this.rebuildGraph();
  }

  /** ###########################################################################
   * buildGraph
   * ##########################################################################*/

  /**
   * @type {RenderState}
   */
  get renderState() {
    return this.context.doc.state;
  }
  get pdg() {
    return this.renderState;
  }

  get root() {
    return this.renderState.timelineNodes?.[PDGRootTimelineId];
  }

  debug(...args) {
    this.logger.debug(...args);
  }

  /** ###########################################################################
   * d3-graphviz implementation
   *  #########################################################################*/

  async rebuildGraph(force = false) {
    const isNew = await this.initGraphImplementation(force);
    // this.debug('new', isNew, this.pdg.settings.anim);

    this.buildGraph(isNew);
  }

  startRenderTimer() {
    if (!this.renderTimer) {
      this.renderTimer = new PrettyTimer();
    }
  }

  buildGraph(isNew) {
    const { root } = this;

    if (!root) {
      return;
    }

    this.clearDeco();  // remove all non-graph elements from graph to avoid errors

    this.startRenderTimer();

    const ShouldAnim = this.pdg.settings.anim;
    if (isNew) {
      this.graphviz
        // NOTE: this `end` event handler is run after anim finished
        .on('end', () => {
          this.renderTimer?.print(null, `Graph Render (dot size = ${(this.graphString?.length / 1000).toFixed(2)}k)`);
          this.renderTimer = null;
          this.clearDeco();  // remove all non-graph elements from graph to avoid errors, again

          try {
            if (ShouldAnim && isNew) {
              // NOTE: we only register animations *after* first render
              this.graphviz.transition(() => { // transition
                this.debug(`anim start`);
                // see https://d3-wiki.readthedocs.io/zh_CN/master/Transitions/#remove
                // if (!this.pdg.settings.anim) {
                // }
                return d3transition()
                  .duration(800);
              });
            }

            // add node and edge decorations to the rendered DOM
            this.decorateAfterRender();
          }
          catch (err) {
            // NOTE: don't throw, or else the error gets swallowed and we get a meaningless "uncaught in Promise (undefined)" message
            this.logger.error(`after render event handler FAILED -`, err);
          }
        });
    }

    // actually render the graph
    // WARNING: `renderDot` is synchronous
    const graphString = this.graphString = this.buildDot();
    this.graphviz.renderDot(graphString);
  }

  async initGraphImplementation(force) {
    // NOTE: use `this.el`'s id
    force ||= RenderCfg.forceReinitGraphviz;
    const shouldBuildNew = force || !this.graphviz;
    if (shouldBuildNew) {
      if (force) {
        /**
         * `d3-graphviz` performance bug hackfix
         * @see https://github.com/magjac/d3-graphviz/issues/232
         */
        if (this.graphEl) {
          this.graphEl.remove();
          this.graphEl = null;
        }
      }

      if (!this.graphEl) {
        this.graphEl = compileHtmlElement('<div id="timeline-graph"></div>');
        this.els.graphcont.appendChild(this.graphEl);
      }
      this.graphviz = d3Graphviz.graphviz(this.graphEl, { ...GraphVizCfg });
      this.debug(`re-initializing graph${force ? ' (force)' : ''}`);
    }
    else {
      // nothing to do for now
    }
    return shouldBuildNew;
  }

  /**
   * 
   */
  buildDot() {
    this.dotBuilder = new DotBuilder(this.renderState);
    return this.dotBuilder.build();
  }

  /** ###########################################################################
   * timeline controls
   *  #########################################################################*/

  async toggleSummaryMode(timelineId) {
    // console.debug('toggleSummaryMode', timelineId);
    await this.remote.toggleSummaryMode({ timelineId });
  }

  async setSummaryMode(timelineId, summaryMode) {
    await this.remote.updateGraph({ timelineId, summaryMode });
  }

  async setGraphSettings(settings) {
    if (!isPlainObject(settings)) {
      throw new Error(`invalid settings must be object: ${settings}`);
    }
    await this.remote.updateGraph({ settings });
  }

  async setGraphSetting(setting, val) {
    const newSettings = {
      ...this.pdg.settings,
      [setting]: val
    };
    await this.remote.updateGraph({ settings: newSettings });
  }

  /** ###########################################################################
   * misc
   * ##########################################################################*/

  public = {
    buildDot() {
      return this.buildDot();
    },
    // takeScreenshot() {
    //   return this.getScreenshot();
    // }
  };


  /** ###########################################################################
   * decorate graph HTML
   * ##########################################################################*/

  /**
   * NOTE: deco elements are mostly elements that we add to the graph.
   * We have to remove them when changing the graph, for graphviz own algorithms to work.
   */
  registerDeco(el) {
    el.classList?.add('deco');
  }

  clearDeco() {
    this._stopHoverAction();

    const els = Array.from(this.el.querySelectorAll('.deco'));
    els.forEach(el => el.remove());
  }

  // rendering finished
  decorateAfterRender = async () => {
    // hackfix: sort so clusters dont obstruct other elements
    Array.from(this.el.querySelectorAll('.graph > g'))
      .sort((a, b) => {
        const aCluster = a.classList.contains('cluster');
        const bCluster = b.classList.contains('cluster');
        if (aCluster === bCluster) {
          // sort clusters by id
          return parseInt(a.id, 10) - parseInt(b.id, 10);
        }
        // always put clusters in the back
        return bCluster - aCluster;
        // return TODO;
        // this.debug(`CMP ${a.id} ${b.id} ${a.id?.localeCompare(b.id || '')}`);
        // return a.id?.localeCompare(b.id || '');
      })
      .forEach(item => item.parentNode.appendChild(item));

    // decorate all nodes
    const nodeEls = Array.from(this.el.querySelectorAll('.node'));
    const clusterEls = Array.from(this.el.querySelectorAll('.cluster'));
    // const clusterEls = Array.from(this.el.querySelectorAll('.cluster')).map(el => ({
    //   el: el.querySelector('text') // grab the label for clusters
    // }));
    const allEls = [...nodeEls, ...clusterEls];
    for (const el of allEls) {
      const { id: timelineId } = el;
      const node = this.renderState.timelineNodes[timelineId];
      if (node) {
        this.decorateNode(node, el);
      }
    }

    const summaryButtons = this.el.querySelectorAll('.summary-button');
    updateElDecorations(summaryButtons);
  }

  /** ###########################################################################
   * node el event listeners
   * Important: make sure, we don't create a new function each time
   * ##########################################################################*/

  #getEventTargetNode(evt) {
    let { node } = evt.target;
    if (!node) {
      const closestNodeEl = evt.target.closest('.node');
      node = closestNodeEl?.node;
      if (!node) {
        // console.warn(`handleNodeMouseOver called on non-node element:`, evt.target, evt);
        // return;
      }
    }
    return node;
  }

  handleGroupLabelClick = async (evt) => {
    const node = this.#getEventTargetNode(evt);
    if (!node) { return; }
    
    await this.toggleSummaryMode(node.timelineId);
  };

  handleNodeClick = async (evt) => {
    const node = this.#getEventTargetNode(evt);
    if (!node) { return; }

    if (node.dataNodeId) {
      await this.remote.selectNode(node.timelineId);
    }
  };

  handleNodeMouseOver = (evt) => {
    // show debug overlay
    const node = this.#getEventTargetNode(evt);
    if (!node) { return; }

    if (!evt.target.debugOverlay && RenderCfg.debugViewEnabled) {
      // this.debug(`Hover node:`, evt.target);
      this.el.appendChild(evt.target.debugOverlay = this.makeNodeDebugOverlay(node));
      // nodeEl.appendChild(debugOverlay = this.makeNodeDebugOverlay(node));
    }

    // show popup menu and more
    this.startNodeHoverAction(node, evt.target);
  };

  handleNodeMouseOut = (evt) => {
    evt.target.debugOverlay?.remove();
    evt.target.debugOverlay = null;
  };


  /** ###########################################################################
   * decorateNode
   * ##########################################################################*/

  /**
   * @param {PDGTimelineNode} node 
   * @param {Element} nodeEl 
   */
  decorateNode(node, nodeEl) {
    const { pdg } = this;
    let interactionEl = nodeEl;

    if (isControlGroupTimelineNode(node.type)) {
      // hackfix: since DOT is very limited, we have to add custom rendering logic here
      const labelEl = this.getSummarizableNodeLabelEl(node, nodeEl);
      const mode = pdgQueries.getNodeSummaryMode(pdg, node);

      const xOffset = 14;// hackfix: move label out of the way (off to the right by this much)
      // const rect = labelEl.getBoundingClientRect();
      // const x = rect.left - xOffset;// parseFloat(labelEl.getAttribute('x'));
      // const y = rect.top - yOffset;
      // const modeEl = compileHtmlElement(`<div class="overlay">${makeSummaryLabel(this.pdg, mode)}</div>`);
      // modeEl.style.left = `${x}px`;
      // modeEl.style.top = `${y}px`;
      // this.registerDeco(modeEl);
      // nodeEl.appendChild(modeEl);
      // // labelEl.setAttribute('x', x + xOffset);
      // this.el.appendChild(modeEl);
      // this.debug('label x,y', x, y, modeEl);

      // NOTE: we need to add an SVG element, since the svg elements get transformed by d3-zoom
      // the bbox etc. values are seemingly very buggy: https://stackoverflow.com/questions/70463171/getboundingclientrect-returns-inaccurate-values-for-complex-svgs-in-chrome
      // Problem: x and y are the center, and we cannot get accurate width of element
      // const rect = labelEl.getBBox();
      const w = labelEl.textLength.baseVal.value; // magic!
      const cx = parseFloat(labelEl.getAttribute('x'));
      const x = cx - w / 2;
      const y = parseFloat(labelEl.getAttribute('y'));
      const modeEl = makeSummaryLabelSvgCompiled(pdg, mode, x, y);
      this.registerDeco(modeEl);
      labelEl.setAttribute('x', cx + xOffset); // move el to the right
      // labelEl.innerHTML = labelEl.innerHTML;
      nodeEl.parentElement.appendChild(modeEl);

      // add click handler to label
      this.addNodeEventListener(node, labelEl, 'mousedown', this.handleGroupLabelClick);

      // future-work: add a bigger popup area, to make things better clickable
      // popupTriggerEl = compileHtmlElement(/*html*/`<`);
      interactionEl = labelEl;
    }

    if (interactionEl) {
      // add overlays
      interactionEl.node = node; // hackfix

      this.addNodeEventListener(node, interactionEl, 'mouseover', this.handleNodeMouseOver);
      this.addNodeEventListener(node, interactionEl, 'mouseout', this.handleNodeMouseOut);

      // add click handler
      // NOTE: we use `mousedown` since `click` regularly gets cancelled by d3-zoom,
      //      b/c it pans ever so slightly every single time the mouse is clicked
      this.addNodeEventListener(node, interactionEl, 'mousedown', this.handleNodeClick);
    }
  }

  /**
   * @param {PDGTimelineNode} node 
   * @param {Element} nodeEl 
   */
  getSummarizableNodeLabelEl(node, nodeEl) {
    return nodeEl.querySelector('text');
  }

  /**
   * @param {*} node 
   * @param {Element} nodeEl 
   * @param {*} evt 
   * @param {*} fn 
   */
  addNodeEventListener(node, nodeEl, evt, fn) {
    // remove if it existed before
    nodeEl.removeEventListener(evt, fn);

    nodeEl.addEventListener(evt, fn);
    // // hackfix: if we don't do it this way, many events go unnoticed?
    // for (const el of nodeEl.children) {
    //   el.addEventListener(evt, fn);
    // }
  }

  /** ###########################################################################
   * overlays
   *  #########################################################################*/

  makeNodeDebugOverlay(node) {
    const { pdg } = this;
    const o = { ...node };

    // fix rendered string
    o.type = PDGTimelineNodeType.nameFrom(o.type);
    o.children = JSON.stringify(o.children); // simplify children

    if (pdgQueries.isNodeSummarizable(pdg, node)) {
      o.summaryMode = PDGSummaryMode.nameFrom(pdg.summaryModes[node.timelineId]);
      o.summary = pdg.nodeSummaries[node.timelineId]; // add summary info
      o.summarizableChildren = pdgQueries.getSummarizableChildren(pdg, node.timelineId).length;
    }
    else {
      o.summarizable = false;
    }

    const content = `Node = ${JSON.stringify(o, null, 2)}`;
    const el = compileHtmlElement(/*html*/`
      <pre class="node-debug-overlay">${content}</pre>`
    );
    this.registerDeco(el);
    return el;
  }



  /**
   * @param {PDGTimelineNode} node 
   * @param {Element} nodeEl 
   */
  makeNodeButtons(node) {
    let modesForThisNode = EmptyArray;
    if (isControlGroupTimelineNode(node.type)) {
      modesForThisNode = GroupDefaultSummaryModes;
    }
    const el = compileHtmlElement(/*html*/`
      <div class="flex-row" style="flex-shrink: 1; justify-content: flex-start; height: ${NodeMenuHeight}px;">
      </div>
    `);

    const { el: btns } = makeSummaryButtons(this.doc, node.timelineId, 'btn btn-primary no-padding', modesForThisNode, true);
    el.appendChild(btns);

    return el;
  }


  /** ###########################################################################
   * hover action management
   *  #########################################################################*/

  _stopHoverAction() {
    this.currentHoverState?.stopHoverState();
    this.currentHoverState = null;

    if (documentMouseMoveHandler) {
      document.removeEventListener('mousemove', documentMouseMoveHandler);
    }
  }

  /**
   * @param {PDGTimelineNode} node 
   * @param {Element} nodeEl 
   */
  startNodeHoverAction(node, nodeEl) {
    if (this.currentHoverState?.node === node) {
      return;
    }

    this._stopHoverAction();
    /**
     * NOTE: `y` is more annoying to get right.
     * @see https://stackoverflow.com/questions/28966678/getboundingclientrect-returning-wrong-results
     */
    // const y = rect.top - rect.height;
    // const y = nodeEl.style.top;
    // const x = 0 - getElLeftOffset(nodeEl);
    // const y = 0 - getElTopOffset(nodeEl) - NodeMenuYOffset;
    // const y = 0 - NodeMenuHeight;
    // const w = rect.width;
    // const h = NodeMenuHeight;
    // <div class="overlay">
    const nodeBtns = this.makeNodeButtons(node);
    const hoverEl = compileHtmlElement(/*html*/`
      <div class="overlay"></div>
    `);
    hoverEl.appendChild(nodeBtns);
    this.registerDeco(hoverEl);

    const rect = nodeEl.getBoundingClientRect();
    const x = rect.left;
    const y = rect.top - NodeMenuHeight - NodeMenuYOffset;
    hoverEl.style.left = `${x}px`;
    hoverEl.style.top = `${y}px`;

    // NOTE: mouseover + mouseout are not going to work when sharing "hover area" between multiple elements, so we use mousemove instead
    const hoverTargets = new Set([hoverEl, nodeEl]);
    let moveTimer;
    const mouseMoveDelayTolerance = 500;
    document.addEventListener('mousemove', documentMouseMoveHandler = (e) => {
      if (moveTimer) { return; }  // debounce
      moveTimer = setTimeout(() => {
        // const el = document.elementFromPoint(e.clientX, e.clientY); // NOTE: this does NOT return the top element
        moveTimer = null;
        /**
         * @see https://stackoverflow.com/a/15263171
         */
        const hoverStack = Array.from(document.querySelectorAll(":hover"));
        if (!hoverStack.some(el => hoverTargets.has(el))) {
          // this.debug('popout', hoverStack);
          this._stopHoverAction();
        }
      }, mouseMoveDelayTolerance);
    });

    this.el.appendChild(hoverEl);

    // start
    this.currentHoverState = new NodeHoverState(this, node, hoverEl);
  }

  /** ###########################################################################
   * screenshot util
   *  #########################################################################*/

  // async getScreenshots(screenshotModes) {
  //   // TODO: iterate through the "screenshot modes" and take a screen of each.
  //   //    Then return it all to host.
  // }

  getScreenshot() {
    this.clearDeco();
    // TODO
    // * take screenshot in current mode
    // * add background to top: <rect width="100%" height="100%" fill="#444"/>
    // const lines = this.graphEl.innerHTML.split('\n');
    // return lines[0] + `\n<rect width="100%" height="100%" fill="#444"/>\n` + lines.slice(1);
    return this.graphEl.innerHTML;
  }
}
