import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { getStaticContextColor } from '@dbux/graph-common/src/shared/contextUtil';
import AsyncNodeDataMap from '@dbux/graph-common/src/shared/AsyncNodeDataMap';
import AsyncEventUpdateType from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import { compileHtmlElement, getMatchParent } from '../../util/domUtil';
import { AsyncButtonClasses } from './asyncButtons';
import GraphBase from '../GraphBase';

/** @typedef {import('../controllers/PopperManager').default} PopperManager */

class AsyncGraph extends GraphBase {
  /**
   * @return {PopperManager}
   */
  get popperManager() {
    return this.context.graphDocument.controllers.getComponent('PopperManager');
  }

  createEl() {
    return compileHtmlElement(/*html*/`
      <div class="grid async-graph">
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
      width,
      displayName,
      locLabel,

      realStaticContextid,
      moduleName,
      postAsyncEventUpdateType,
      hasError,
    } = nodeData;

    const { themeMode } = this.context;
    // const moduleLabel = moduleName ? `${moduleName} | ` : '';

    const backgroundColor = getStaticContextColor(themeMode, realStaticContextid, !!moduleName);

    let shortLabel;
    switch (postAsyncEventUpdateType) {
      case AsyncEventUpdateType.PostAwait:
        shortLabel = 'A';
        break;
      case AsyncEventUpdateType.PostThen:
        shortLabel = 'T';
        break;
      case AsyncEventUpdateType.PostCallback:
        shortLabel = 'C';
        break;
      default:
        shortLabel = '⬤';
        break;
    }
    if (hasError) {
      shortLabel += '🔥';
    }
    const { asyncNodeId, applicationId, isTerminalNode } = asyncNode;
    const asyncNodeData = {
      'async-node-id': asyncNodeId,
      'application-id': applicationId
    };
    const dataAttrs = Object.entries(asyncNodeData).map(([key, val]) => `data-${key}="${val || ''}"`).join(' ');
    const classes = [];
    if (isTerminalNode) {
      classes.push('terminal-node');
    }
    const classAttrs = classes.join(' ');
    const styleProps = `
      background-color: ${backgroundColor};
      ${makeGridPositionProp(rowId, colId, { colSpan: width })}
    `;

    return /*html*/`
        <div class="async-cell async-node full-width flex-row align-center ${classAttrs}" style="${styleProps}" ${dataAttrs}>
          <div class="async-brief flex-row main-axie-align-center">
            ${shortLabel}
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
    const visitedColId = new Set();
    const decorations = [];
    for (const nodeData of children) {
      const { colId, asyncNode: { applicationId, threadId, asyncNodeId } } = nodeData;
      if (!visitedColId.has(colId)) {
        visitedColId.add(colId);
        const positionProp = makeGridPositionProp(1, colId, { noHeaderPadding: true });
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

  /**
   * @param {{applicationId: number, asyncNodeId: number}} asyncNode 
   * @return {HTMLElement}
   */
  getAsyncNodeEl({ applicationId, asyncNodeId }) {
    const data = {
      'application-id': applicationId,
      'async-node-id': asyncNodeId,
    };
    const dataSelector = Object.entries(data).map(([key, val]) => `[data-${key}="${val || ''}"]`).join('');
    const selector = `.async-node${dataSelector}`;
    return document.querySelector(selector);
  }

  public = {
    /**
     * @param {{applicationId: number, asyncNodeId: number}} asyncNode 
     * @param {boolean} ignoreFailed 
     */
    focusAsyncNode: (asyncNode, ignoreFailed = false) => {
      const asyncNodeEl = this.getAsyncNodeEl(asyncNode);
      if (asyncNodeEl) {
        this.focusController.slide(asyncNodeEl);
      }
      else if (!ignoreFailed) {
        this.logger.error(`Cannot find DOM of asyncNode: ${JSON.stringify(asyncNode)} when trying to focus`);
      }
    },

    /**
     * @param {{applicationId: number, asyncNodeId: number}} asyncNode 
     * @param {boolean} ignoreFailed 
     */
    selectAsyncNode: (asyncNode, ignoreFailed = false) => {
      document.querySelectorAll('.async-node.async-cell-selected').forEach(node => {
        node.classList.remove('async-cell-selected');
      });
      if (asyncNode) {
        const asyncNodeEl = this.getAsyncNodeEl(asyncNode);
        if (asyncNodeEl) {
          asyncNodeEl.classList.add('async-cell-selected');
        }
        else if (!ignoreFailed) {
          this.logger.error(`Cannot find DOM of asyncNode: ${JSON.stringify(asyncNode)} when trying to select`);
        }
      }
    },

    /**
     * @param {{applicationId: number, asyncNodeId: number}[]} asyncNodes 
     * @param {boolean} ignoreFailed 
     */
    highlightStack: (asyncNodes, ignoreFailed = false) => {
      document.querySelectorAll('.async-node.async-cell-stack-highlight').forEach(node => {
        node.classList.remove('async-cell-stack-highlight');
      });
      if (asyncNodes) {
        asyncNodes.forEach((asyncNode) => {
          const asyncNodeEl = this.getAsyncNodeEl(asyncNode);
          if (asyncNodeEl) {
            asyncNodeEl.classList.add('async-cell-stack-highlight');
          }
          else if (!ignoreFailed) {
            this.logger.error(`Cannot find DOM of asyncNode: ${JSON.stringify(asyncNodes)} when trying to select`);
          }
        });
      }
    }
  }
}
export default AsyncGraph;

// ###########################################################################
// util
// ###########################################################################

function makeGridPositionProp(row, col, { colSpan = 1, noHeaderPadding = false } = EmptyObject) {
  const headerPadding = noHeaderPadding ? 0 : 1;
  return `grid-row-start: ${row + headerPadding};grid-column: ${col} / span ${colSpan};`;
}
