import { compileHtmlElement, getMatchParent } from '../../util/domUtil';
import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';
import { AsyncButtonClasses } from './asyncButtons';

/** @typedef {import('../controllers/PopperManager').default} PopperManager */

class AsyncNodeDataMap {
  /**
   * @type {Map.<String, >}
   */
  _nodes;

  constructor() {
    this._nodes = new Map();
  }

  add(asyncNodeData) {
    const { asyncNode: { applicationId, asyncNodeId } } = asyncNodeData;
    this._nodes.set(this._makeKey(applicationId, asyncNodeId), asyncNodeData);
  }

  get(applicationId, asyncNodeId) {
    return this._nodes.get(this._makeKey(applicationId, asyncNodeId));
  }

  clear() {
    this._nodes.clear();
  }

  _makeKey(applicationId, asyncNodeId) {
    return `${applicationId}_${asyncNodeId}`;
  }
}

class AsyncGraph extends ClientComponentEndpoint {
  /**
   * @return {PopperManager}
   */
  get popperManager() {
    return this.context.graphDocument.controllers.getComponent('PopperManager');
  }

  createEl() {
    return compileHtmlElement(/*html*/`
      <div class="graph-root grid async-graph">
        <div style="grid-area:header;">
          <h4>Applications:</h4>
          <pre data-el="applications"></pre>
        </div>
        <div data-el="main" style="grid-area:main;" class="grid grid-center async-grid"></div>
      </div>
    `);
  }

  setupEl() {
    this.allNodeData = new AsyncNodeDataMap();
    // delegate async node click events
    this.els.main.addEventListener('click', event => {
      const asyncNodeEl = getMatchParent('div.async-cell', event.target, this.els.main);
      if (asyncNodeEl) {
        const applicationId = Number(asyncNodeEl.dataset.applicationId);
        const asyncNodeId = Number(asyncNodeEl.dataset.asyncNodeId);
        const asyncNodeData = this.allNodeData.get(applicationId, asyncNodeId);
        if (event.target.matches('div.async-header')) {
          this.handleClickAsyncHeader(asyncNodeData);
        }
        else {
          this.handleClickAsyncNode(asyncNodeData);
        }
      }
    });

    // delegate async button click events
    this.popperManager.tooltipContainer.addEventListener('click', event => {
      if (event.target.matches('button.async-button')) {
        const asyncNodeEl = getMatchParent('div.async-button-wrapper', event.target, this.popperManager.tooltipContainer);
        if (asyncNodeEl) {
          const applicationId = Number(asyncNodeEl.dataset.applicationId);
          const asyncNodeId = Number(asyncNodeEl.dataset.asyncNodeId);
          const asyncNodeData = this.allNodeData.get(applicationId, asyncNodeId);
          this.handleClickAsyncButton(asyncNodeData, event.target);
        }
      }
    });

    this.els.main.addEventListener('click', event => {
      const asyncNodeEl = getMatchParent('div.async-node', event.target, this.els.main);
      if (asyncNodeEl) {
        const applicationId = Number(asyncNodeEl.dataset.applicationId);
        const asyncNodeId = Number(asyncNodeEl.dataset.asyncNodeId);
        const asyncNodeData = this.allNodeData.get(applicationId, asyncNodeId);
        this.popperManager.show(asyncNodeEl, this.makeAsyncButtons(asyncNodeData));
      }
      else {
        this.popperManager.hide();
      }
    }, true);
  }

  update() {
    this.updateNodeDataMap();
    this.setUpApplications();
    this.setUpAsyncNodes();
  }

  updateNodeDataMap() {
    this.allNodeData.clear();
    this.state.children?.forEach(node => this.allNodeData.add(node));
  }

  setUpApplications() {
    const { applications } = this.state;
    if (applications?.length) {
      this.els.applications.textContent = ` ${applications.map(app => app.name).join('\n ')}`;
    }
    else {
      this.els.applications.textContent = '(no applications selected)';
    }
  }

  // ###########################################################################
  // render
  // ###########################################################################

  setUpAsyncNodes() {
    const { children } = this.state;
    if (children?.length) {
      let mainHTML = '';
      mainHTML += children.map(child => this.makeAsyncNodeEl(child)).join('');
      mainHTML += this.makeParentThreadDecoration();
      mainHTML += this.makeLineInThreadDecoration();
      mainHTML += this.makeHeaderEl();

      this.els.main.innerHTML = mainHTML;
    }
    else {
      this.els.main.textContent = '(no async event recorded)';
    }
  }

  makeAsyncNodeEl(nodeData) {
    const {
      asyncNode,
      rowId,
      colId,
      displayName,
      locLabel,
    } = nodeData;

    const dotLabel = '⬤';
    const { asyncNodeId, applicationId } = asyncNode;
    const asyncNodeData = {
      'async-node-id': asyncNodeId,
      'application-id': applicationId
    };
    const dataAttrs = Object.entries(asyncNodeData).map(([key, val]) => `data-${key}="${val || ''}"`).join(' ');
    const positionProps = makeGridPositionProp(rowId, colId);

    return /*html*/`
        <div class="async-cell async-node full-width flex-row align-center" style="${positionProps}" ${dataAttrs}>
          <div class="async-brief flex-row main-axie-align-center">
            ${dotLabel}
          </div>
          <div class="async-detail flex-column cross-axis-align-center">
            <div class="ellipsis-10">${displayName}</div>
            <div class="async-loc-label gray">
              <span>${locLabel}</span>
            </div>
          </div>
        </div>
      `;
  }

  /**
   * @returns {HTMLElement}
   */
  makeAsyncButtons(nodeData) {
    const buttonsHTML = Object.entries(AsyncButtonClasses).map(([name, ButtonClass]) => {
      const available = ButtonClass.isAvailable(nodeData);
      if (available) {
        const { label, title } = ButtonClass;
        return /*html*/`<button class="async-button" title="${title}" data-button-type="${name}">${label}</button>`;
      }
      return null;
    }).filter(x => !!x).join('');
    const { applicationId, asyncNodeId } = nodeData.asyncNode;
    const buttonWrapperEl = compileHtmlElement(/*html*/`<div class="async-button-wrapper">${buttonsHTML}</div>`);
    buttonWrapperEl.dataset.applicationId = applicationId;
    buttonWrapperEl.dataset.asyncNodeId = asyncNodeId;
    return buttonWrapperEl;
  }

  makeParentThreadDecoration() {
    const { children } = this.state;
    const visitedColId = new Set();
    const decorations = [];
    for (const nodeData of children) {
      const { colId, parentRowId } = nodeData;
      if (!visitedColId.has(colId) && parentRowId) {
        visitedColId.add(colId);
        const positionProp = makeGridPositionProp(parentRowId, colId);
        decorations.push(/*html*/`
        <div class="async-node full-width flex-row align-center" style="${positionProp}">
          <div class="async-detail flex-column cross-axis-align-center">⬤</div>
        </div>
        `);
      }
    }
    return decorations.join('');
  }

  makeLineInThreadDecoration() {
    return '';
    // const { children } = this.state;
    // const minRowIdByCol = new Map();
    // const maxRowIdByCol = new Map();
    // const asyncNodePositions = new Set();
    // const decorations = [];

    // for (const nodeData of children) {
    //   const { colId, rowId } = nodeData;
    //   !minRowIdByCol.get(colId) && minRowIdByCol.set(colId, rowId);
    //   maxRowIdByCol.set(colId, rowId);
    //   asyncNodePositions.add(`${colId}_${rowId}`);
    // }

    // for (const colId of minRowIdByCol.keys()) {

    // }

    // return decorations.join('');
  }

  makeHeaderEl() {
    const { children, selectedApplicationId } = this.state;
    const selectedThreadIds = new Set(this.state.selectedThreadIds);
    const threadByColId = new Set();
    const decorations = [];
    for (const nodeData of children) {
      const { colId, asyncNode: { applicationId, threadId, asyncNodeId } } = nodeData;
      if (!threadByColId.has(colId)) {
        threadByColId.add(colId);
        const positionProp = makeGridPositionProp(1, colId, 0);
        const dataLabel = `data-application-id="${applicationId}" data-thread-id="${threadId}" data-async-node-id="${asyncNodeId}"`;
        const selectedClass = (applicationId === selectedApplicationId && selectedThreadIds.has(threadId)) ? 'async-cell-selected' : '';
        decorations.push(/*html*/`
        <div class="async-cell async-header flex-row align-center async-detail ${selectedClass}" style="${positionProp}" ${dataLabel}>
          ${applicationId}_${threadId}
        </div>
        `);
      }
    }
    return decorations.join('');
  }

  // ###########################################################################
  // event handlers
  // ###########################################################################

  handleClickAsyncNode(asyncNodeData) {
    const { asyncNode: { applicationId, asyncNodeId } } = asyncNodeData;

    if (applicationId && asyncNodeId) {
      this.remote.gotoAsyncNode(applicationId, asyncNodeId);
    }
  }

  handleClickAsyncButton(asyncNodeData, buttonEl) {
    const { buttonType } = buttonEl.dataset;
    AsyncButtonClasses[buttonType].handleClick(this, asyncNodeData);
  }

  handleClickAsyncHeader(asyncNodeData) {
    const { applicationId, threadId } = asyncNodeData.asyncNode;

    if (applicationId && threadId) {
      this.remote.selectRelevantThread(applicationId, threadId);
    }
  }
}
export default AsyncGraph;

// ###########################################################################
// util
// ###########################################################################

function makeGridPositionProp(row, col, headerPadding = 1) {
  return `grid-row-start: ${row + headerPadding};grid-column-start: ${col};`;
}
