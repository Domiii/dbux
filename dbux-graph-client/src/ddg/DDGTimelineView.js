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
import { DDGRootTimelineId } from '@dbux/data/src/ddg/constants';
import DDGSummaryMode from '@dbux/data/src/ddg/DDGSummaryMode';
import ddgQueries, { RenderState } from '@dbux/data/src/ddg/ddgQueries';
import DDGTimelineNodeType, { isControlGroupTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { getStructuredRandomAngle, makeStructuredRandomColor } from '@dbux/graph-common/src/shared/contextUtil';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { compileHtmlElement } from '../util/domUtil';
import { updateElDecorations, makeSummaryButtons, makeSummaryLabel, makeSummaryLabelSvgCompiled, makeSummaryLabelEl } from './ddgDomUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import DotBuilder from './DotBuilder';
import sleep from '@dbux/common/src/util/sleep';
import { DDGTimelineNode } from '@dbux/data/src/ddg/DDGTimelineNodes';

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

const GroupDefaultSummaryModes = [
  DDGSummaryMode.CollapseSummary,
  DDGSummaryMode.SummarizeChildren,
  DDGSummaryMode.ExpandSubgraph
];

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

const GraphVizCfg = {
  useWorker: true
};

const RenderCfg = {
  // NOTE: also sync with css class
  edgeHighlightDelay: 5000,
  highlightColorCfg: {
    sat: 100
  },
  forceReinitGraphviz: false,
  // forceReinitGraphviz: true
  debugViewEnabled: false
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
   * @type {DDGTimelineView}
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
        ddg: {
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
        /**
         * @type {Element}
         */
        const fakeEl = edgeEl.cloneNode();
        fakeEl.innerHTML = edgeEl.innerHTML; // NOTE: cloneNode is shallow
        fakeEl.setAttribute('id', ''); // unset id
        this.timeline.registerDeco(fakeEl);

        const edgeId = allEdgeIds[i];
        const col = makeStructuredRandomColor(themeMode, edgeId % 50, { sat: 100, start: Math.round(edgeId / 50) * 30 });
        fakeEl.querySelectorAll('path,polygon').forEach(el => {
          el.setAttribute('stroke', col);
          el.setAttribute('stroke-width', 5);
        });
        // edgeEl.parentElement.insertBefore(fakeEl, edgeEl.nextSibling);
        edgeEl.parentElement.appendChild(fakeEl); // move to end, so its on top
        return fakeEl;
      });
  }

  #stopHighlight() {
    // play fade out animation
    this.fakeEdgeEls.forEach((el) => {
      el.classList.add('fadeout-5');
      setTimeout(
        () => {
          el.remove(); // delete fake el afterward
        },
        RenderCfg.edgeHighlightDelay);
    });
  }
}

/** ###########################################################################
 * {@link DDGTimelineView}
 *  #########################################################################*/

export default class DDGTimelineView extends ClientComponentEndpoint {
  /**
   * @type {NodeHoverState}
   */
  currentHoverState;

  get doc() {
    return this.context.doc;
  }

  createEl() {
    return compileHtmlElement(/*html*/`<div id="ddg-timeline" class="timeline-view">
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
  get ddg() {
    return this.renderState;
  }

  get root() {
    return this.renderState.timelineNodes?.[DDGRootTimelineId];
  }

  /** ###########################################################################
   * d3-graphviz implementation
   *  #########################################################################*/

  async rebuildGraph(force = false) {
    const isNew = await this.initGraphImplementation(force);
    // console.log('new', isNew, this.ddg.settings.anim);

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

    const graphString = this.graphString = this.buildDot();
    // const graphString = 'digraph { a -> b }';
    this.graphviz
      .renderDot(graphString);

    if (isNew) {
      const ShouldAnim = true;
      this.renderTimer = new PrettyTimer();
      this.graphviz
        .on('end', () => {
          this.renderTimer?.print(null, `Graph Render (dot size = ${(this.graphString?.length / 1000).toFixed(2)})`);
          this.renderTimer = null;
          this.clearDeco();  // remove all non-graph elements from graph to avoid errors, again

          try {
            if (ShouldAnim) {
              console.log('anim1');
              // NOTE: we only register animations *after* first render
              this.graphviz.transition(() => { // transition
                // TODO: add a way to remove animation
                // see https://d3-wiki.readthedocs.io/zh_CN/master/Transitions/#remove
                // if (!this.ddg.settings.anim) {
                // }
                console.log('anim2');
                return d3transition()
                  .duration(800);
              }).on('end', () => {
                try {
                  console.log('anim3');
                  // add node and edge decorations to the rendered DOM
                  this.decorateAfterRender();
                }
                catch (err) {
                  this.logger.error(`after anim event handler FAILED -`, err);
                }
              });
            }
            
            if (!ShouldAnim || isNew) {
              // add node and edge decorations to the rendered DOM
              this.decorateAfterRender();
            }
          }
          catch (err) {
            // NOTE: don't throw, or else the error gets swallowed and we get a meaningless "uncaught in Promise (undefined)" message
            this.logger.error(`after render event handler FAILED -`, err);
          }
        });
    }
  }

  async initGraphImplementation(force) {
    // NOTE: use `this.el`'s id
    const shouldBuildNew = force || RenderCfg.forceReinitGraphviz || !this.graphviz;
    if (shouldBuildNew) {
      if (RenderCfg.forceReinitGraphviz) {
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
      console.debug(`re-initializing graph${RenderCfg.forceReinitGraphviz ? ' (force)' : ''}`);
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
    this.dotBuilder = new DotBuilder(this.doc, this.renderState);
    return this.dotBuilder.build();
  }

  /** ###########################################################################
   * timeline controls
   *  #########################################################################*/

  async toggleSummaryMode(timelineId) {
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
      ...this.ddg.settings,
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
    }
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
        // console.debug(`CMP ${a.id} ${b.id} ${a.id?.localeCompare(b.id || '')}`);
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

  /**
   * @param {DDGTimelineNode} node 
   * @param {Element} nodeEl 
   */
  decorateNode(node, nodeEl) {
    const { ddg } = this;
    let interactionEl = nodeEl;

    if (
      ddgQueries.isNodeSummarizable(node) &&

      // TODO: this check should now be taken care of by isVisible (not necessary anymore)
      (!ddgQueries.isNodeSummarizedMode(ddg, node) || ddgQueries.doesNodeHaveSummary(ddg, node))
    ) {
      // hackfix: since DOT is very limited, we have to add custom rendering logic here
      const labelEl = this.getSummarizableNodeLabelEl(node, nodeEl);
      const mode = ddgQueries.getNodeSummaryMode(ddg, node);

      const xOffset = 14;// hackfix: move label out of the way (off to the right by this much)
      const yOffset = 10;
      // const rect = labelEl.getBoundingClientRect();
      // const x = rect.left - xOffset;// parseFloat(labelEl.getAttribute('x'));
      // const y = rect.top - yOffset;
      // const modeEl = compileHtmlElement(`<div class="overlay">${makeSummaryLabel(this.ddg, mode)}</div>`);
      // modeEl.style.left = `${x}px`;
      // modeEl.style.top = `${y}px`;
      // this.registerDeco(modeEl);
      // nodeEl.appendChild(modeEl);
      // // labelEl.setAttribute('x', x + xOffset);
      // this.el.appendChild(modeEl);
      // console.log('label x,y', x, y, modeEl);

      // NOTE: we need to add an SVG element, since the svg elements get transformed by d3-zoom
      // the bbox etc. values are seemingly very buggy: https://stackoverflow.com/questions/70463171/getboundingclientrect-returns-inaccurate-values-for-complex-svgs-in-chrome
      // Problem: x and y are the center, and we cannot get accurate width of element
      // const rect = labelEl.getBBox();
      const w = labelEl.textLength.baseVal.value; // magic!
      const cx = parseFloat(labelEl.getAttribute('x'));
      const x = cx - w / 2;
      const y = parseFloat(labelEl.getAttribute('y')) - yOffset;
      const modeEl = makeSummaryLabelSvgCompiled(ddg, mode, x, y);
      this.registerDeco(modeEl);
      labelEl.setAttribute('x', cx + xOffset); // move el to the right
      // labelEl.innerHTML = labelEl.innerHTML;
      nodeEl.parentElement.appendChild(modeEl);

      // add click handler to label
      labelEl.addEventListener('mousedown', () => {
        return this.toggleSummaryMode(node.timelineId);
      });

      // future-work: add a bigger popup area, to make things better clickable
      // popupTriggerEl = compileHtmlElement(/*html*/`<`);
      interactionEl = labelEl;
    }

    if (interactionEl) {
      // add overlays
      let debugOverlay;
      this.addNodeEventListener(node, interactionEl, 'mouseover', (evt) => {
        // show debug overlay
        if (!debugOverlay && RenderCfg.debugViewEnabled) {
          // console.debug(`Hover node:`, evt.target);
          this.el.appendChild(debugOverlay = this.makeNodeDebugOverlay(node));
          // nodeEl.appendChild(debugOverlay = this.makeNodeDebugOverlay(node));
        }

        // show popup menu and more
        this.startNodeHoverAction(node, nodeEl, interactionEl);
      });
      this.addNodeEventListener(node, interactionEl, 'mouseout', () => {
        debugOverlay?.remove();
        debugOverlay = null;
      });

      // add click handler
      // NOTE: we use `mousedown` since `click` regularly gets cancelled by d3-zoom,
      //      b/c it pans ever so slightly every single time the mouse is clicked
      this.addNodeEventListener(node, interactionEl, 'mousedown', async (evt) => {
        if (node.dataNodeId) {
          await this.remote.selectNode(node.timelineId);
        }
      });
    }
  }

  /**
   * @param {DDGTimelineNode} node 
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
    const { ddg } = this;
    const o = { ...node };

    // fix rendered string
    o.type = DDGTimelineNodeType.nameFrom(o.type);
    o.children = JSON.stringify(o.children); // simplify children
    o.summaryMode = DDGSummaryMode.nameFrom(ddg.summaryModes[node.timelineId]);
    if (ddgQueries.isNodeSummarizable(node)) {
      o.summary = ddg.nodeSummaries[node.timelineId]; // add summary info
    }

    const content = `Node = ${JSON.stringify(o, null, 2)}`;
    const el = compileHtmlElement(/*html*/`
      <pre class="node-debug-overlay">${content}</pre>`
    );
    this.registerDeco(el);
    return el;
  }



  /**
   * @param {DDGTimelineNode} node 
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
   * @param {DDGTimelineNode} node 
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
          // console.log('popout', hoverStack);
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

  async getScreenshots() {
    // TODO: iterate through the "screenshot modes" and take a screen of each.
    //    Then return it all to host.
  }

  async getScreenshot() {
    // TODO
    // * take screenshot in current mode
    // * export to svg (and/or png? if necessary?)
    // * add background to top: <rect width="100%" height="100%" fill="#444"/>
  }
}
