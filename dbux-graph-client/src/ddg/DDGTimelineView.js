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
import { RootTimelineId } from '@dbux/data/src/ddg/constants';
import DDGSummaryMode from '@dbux/data/src/ddg/DDGSummaryMode';
import ddgQueries, { RenderState } from '@dbux/data/src/ddg/ddgQueries';
import DDGTimelineNodeType, { isControlGroupTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { compileHtmlElement } from '../util/domUtil';
import { updateElDecorations, makeSummaryButtons, makeSummaryLabel, makeSummaryLabelSvgCompiled } from './ddgDomUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import DotBuilder from './DotBuilder';

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
  useWorker: false
};

export default class DDGTimelineView extends ClientComponentEndpoint {
  /**
   * @type {Element}
   */
  currentHoverEl;

  currentHoverNode;

  get doc() {
    return this.context.doc;
  }

  createEl() {
    return compileHtmlElement(/*html*/`<div id="ddg-timeline" data-el="graph" class="timeline-view">
      <div data-el="status"></div>
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
    return this.renderState.timelineNodes?.[RootTimelineId];
  }

  /** ###########################################################################
   * d3-graphviz implementation
   *  #########################################################################*/

  rebuildGraph() {
    const isNew = this.initGraphImplementation();
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

    const graphString = this.buildDot();
    // const graphString = 'digraph { a -> b }';
    this.graphviz
      .renderDot(graphString);

    if (isNew) {
      this.renderTimer = new PrettyTimer();
      this.graphviz
        .on('end', () => {
          this.renderTimer?.print(null, 'Graph Render');
          this.renderTimer = null;
          try {
            // // if (this.ddg.settings.anim) {
            // // NOTE: add transition only after first render
            // this.graphviz.transition(() => { // transition
            //   // TODO: add a way to remove animation
            //   // see https://d3-wiki.readthedocs.io/zh_CN/master/Transitions/#remove
            //   // if (!this.ddg.settings.anim) {
            //   // }
            //   return d3transition()
            //     .duration(800);
            // });
            // // }

            // add node and edge decorations to the rendered DOM
            this.decorateAfterRender();
          }
          catch (err) {
            // NOTE: don't throw, or else the error gets swallowed and we get a meaningless "uncaught in Promise (undefined)" message
            this.logger.error(`after render event handler FAILED -`, err);
          }
        });
    }
  }

  initGraphImplementation() {
    // NOTE: use `this.el`'s id
    const shouldBuildNew = !this.graphviz;
    if (shouldBuildNew) {
      this.graphviz = d3Graphviz.graphviz('#ddg-timeline', { ...GraphVizCfg });
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
    const els = Array.from(this.el.querySelectorAll('.deco'));
    els.forEach(el => el.remove());
  }

  // rendering finished
  decorateAfterRender = async () => {
    // hackfix: sort so clusters dont obstruct other elements
    Array.from(this.el.querySelectorAll('.graph > g'))
      .sort((a, b) => {
        const aBack = a.classList.contains('cluster');
        const bBack = b.classList.contains('cluster');
        return bBack - aBack;
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
      const xOffset = 12;// hackfix: move both off to the right a bit
      const yOffset = 10;
      const sepX = 12; // separate them by this much
      const x = parseFloat(labelEl.getAttribute('x'));
      const y = parseFloat(labelEl.getAttribute('y')) - yOffset;
      const modeEl = makeSummaryLabelSvgCompiled(ddg, mode, x - sepX + xOffset, y);
      this.registerDeco(modeEl);
      nodeEl.appendChild(modeEl);
      labelEl.setAttribute('x', x + xOffset);
      // labelEl.innerHTML = '&nbsp;&nbsp;&nbsp;' + labelEl.innerHTML;
      // console.log('label x,y', x, y);

      // future-work: add a bigger popup area, to make things better clickable
      // popupTriggerEl = compileHtmlElement(/*html*/`<`);
      interactionEl = labelEl;
    }

    if (interactionEl) {
      // add overlays
      let debugOverlay;
      this.addNodeEventListener(node, interactionEl, 'mouseover', (evt) => {
        // create overlay lazily
        if (!debugOverlay) {
          // console.debug(`Hover node:`, evt.target);
          this.el.appendChild(debugOverlay = this.makeNodeDebugOverlay(node));
          // nodeEl.appendChild(debugOverlay = this.makeNodeDebugOverlay(node));
        }
        this.maybeShowNodePopupEl(node, nodeEl, interactionEl);
      });
      this.addNodeEventListener(node, interactionEl, 'mouseout', () => {
        debugOverlay?.remove();
        debugOverlay = null;
      });

      // add click handler
      this.addNodeEventListener(node, interactionEl, 'click', async (evt) => {
        if (node.dataNodeId) {
          await this.remote.selectNode(node.timelineId);
        }
      });
    }
  }

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


  _removeNodePopup(hoverEl) {
    if (this.currentHoverEl !== hoverEl) { // race condition check
      return;
    }
    this.currentHoverEl?.remove();
    this.currentHoverEl = null;
    this.currentHoverNode = null;

    if (documentMouseMoveHandler) {
      document.removeEventListener('mousemove', documentMouseMoveHandler);
    }
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

  /**
   * @param {DDGTimelineNode} node 
   * @param {Element} nodeEl 
   */
  maybeShowNodePopupEl(node, nodeEl) {
    if (node === this.currentHoverNode) {
      return;
    }

    // console.log('popUP');
    this._removeNodePopup(this.currentHoverEl);

    const rect = nodeEl.getBoundingClientRect();
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
    // <div class="node-overlay">
    const nodeBtns = this.makeNodeButtons(node);
    const hoverEl = this.currentHoverEl = compileHtmlElement(/*html*/`
      <div class="node-overlay"></div>
    `);
    hoverEl.appendChild(nodeBtns);
    this.registerDeco(hoverEl);
    const x = rect.left;
    const y = rect.top - NodeMenuHeight - NodeMenuYOffset;
    hoverEl.style.left = `${x}px`;
    hoverEl.style.top = `${y}px`;

    // NOTE: mouseover + mouseout are not going to work when sharing "hover area" between multiple elements, so we use mousemove instead
    const hoverTargets = new Set([hoverEl, nodeEl]);
    let moveTimer;
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
          this._removeNodePopup(hoverEl);
        }
      }, 80);
    });

    // this.el.appendChild(this.currentHoverEl);
    // nodeEl.appendChild(hoverEl);
    this.el.appendChild(hoverEl);
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
