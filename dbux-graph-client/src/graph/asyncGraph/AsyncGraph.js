import EmptyObject from '@dbux/common/src/util/EmptyObject';
import AsyncEventUpdateType from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import { makeStructuredRandomColor } from '@dbux/graph-common/src/shared/contextUtil';
import AsyncNodeDataMap from '@dbux/graph-common/src/graph/types/AsyncNodeDataMap';
import AsyncNodeData from '@dbux/graph-common/src/graph/types/AsyncNodeData';
import { compileHtmlElement, getMatchParent } from '../../util/domUtil';
import { AsyncButtonClasses } from './asyncButtons';
import GraphBase from '../GraphBase';

/** @typedef {import('../controllers/PopperManager').default} PopperManager */

const Verbose = false;

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
        <div data-el="main" style="grid-area:main;" class="graph-body grid async-grid"></div>
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
        else if (event.target.matches('span.error-label')) {
          this.handleClickErrorLabel(asyncNodeData);
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
      // mainHTML += this.makeParentThreadDecoration();
      mainHTML += children.map(child => this.makeAsyncEdgeDecoration(child)).join('');
      // TODO: re-enable headers when thread/column filtering features are re-enabled
      // mainHTML += this.makeHeaderEl();

      this.els.main.innerHTML = mainHTML;
    }
    else {
      this.els.main.textContent = '(no async event recorded)';
    }
  }

  /**
   * @param {AsyncNodeData} nodeData 
   */
  makeAsyncNodeEl(nodeData) {
    const {
      asyncNode,

      rowId,
      colId,
      width,
      displayName,
      locLabel,

      isProgramRoot,
      realStaticContextid,
      packageName,
      postAsyncEventUpdateType,
      hasError,
      nestingDepth,
      stats,
    } = nodeData;

    const { themeMode, screenshotMode } = this.context;
    // const highContractMode = screenshotMode && !asyncDetailMode;
    const highContractMode = screenshotMode;
    // const moduleLabel = packageName ? `${packageName} | ` : '';

    const backgroundColor = makeStructuredRandomColor(themeMode, realStaticContextid, { bland: !!packageName, highContractMode });

    let leftLabel = '', errorLabel = '', statsRawEl = '';
    let shortLabel, fullLabel = displayName;

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
        if (isProgramRoot) {
          shortLabel = 'F'; // File
        }
        else {
          shortLabel = '⬤';
        }
        break;
    }
    if (screenshotMode) {
      shortLabel = '';
      // fullLabel = '';
    }
    if (shortLabel) {
      shortLabel = /*html*/`<span class="lesser-label">${shortLabel}</span>`;
    }
    const classes = [];
    if (hasError) {
      classes.push('async-error');
      errorLabel = '🔥';
    }
    if (nestingDepth) {
      const depthLabel = /*html*/`<span class="depth-label lesser-label">${nestingDepth}</span>`;
      leftLabel = depthLabel;
      // shortLabel = `${depthLabel}${shortLabel}`;
      // fullLabel = `${depthLabel}${fullLabel}`;
    }

    // generate stats label
    const { statsIconUris } = this.context.graphDocument.state;
    const {
      nTreeContexts,
      nTreeStaticContexts,
      nTreeFileCalled,
      nTreeTraces,
      nTreePackages,
    } = stats;
    statsRawEl = /*html*/`
      <div class="grid async-detail" style="width: max-content;">
        <div style="grid-row: 1; grid-column:1;" class="context-stats" title="Amount of packages in subgraph: ${nTreePackages}">
          <img src="${statsIconUris.nTreePackages}" /><span>${nTreePackages}</span>
        </div>
        <div style="grid-row: 1; grid-column:2;" class="context-stats" title="Amount of files involved in subgraph: ${nTreeFileCalled}">
          <img src="${statsIconUris.nTreeFileCalled}" /><span>${nTreeFileCalled}</span>
        </div>
        <div style="grid-row: 1; grid-column:3;" class="context-stats" title="Amount of static contexts involved in subgraph: ${nTreeStaticContexts}">
          <img src="${statsIconUris.nTreeStaticContexts}" /><span>${nTreeStaticContexts}</span>
        </div>
        <div style="grid-row: 1; grid-column:4;" class="context-stats" title="Amount of child contexts in subgraph: ${nTreeContexts}">
          <img src="${statsIconUris.nTreeContexts}" /><span>${nTreeContexts}</span>
        </div>
        <div style="grid-row: 1; grid-column:5;" class="context-stats" title="Amount of traces in subgraph: ${nTreeTraces} (approximates the amount of executed statements/expressions)">
          <img src="${statsIconUris.nTreeTraces}" /><span>${nTreeTraces}</span>
        </div>
      </div>
    `;

    const { asyncNodeId, applicationId, isTerminalNode } = asyncNode;
    const asyncNodeData = {
      'async-node-id': asyncNodeId,
      'application-id': applicationId
    };
    const dataAttrs = Object.entries(asyncNodeData).map(([key, val]) => `data-${key}="${val || ''}"`).join(' ');
    if (isTerminalNode) {
      classes.push('terminal-node');
    }
    const classAttrs = classes.join(' ');
    const styleProps = `
      background-color: ${backgroundColor};
      ${makeGridPositionProp(rowId, colId, { colSpan: width })}
    `;

    return /*html*/`
        <div class="async-cell async-node flex-row align-center ${classAttrs}" style="${styleProps}" ${dataAttrs}>
          <div class="left-label">${leftLabel}</div>
          <div class="async-brief full-width">
            ${shortLabel}
            <span class="error-label">${errorLabel}</span>
          </div>
          <div class="async-detail full-width flex-column cross-axis-align-center">
            <div class="full-width flex-row align-center">
              <div class="ellipsis-10 async-context-label">${fullLabel}</div>
              <div class="ellipsis-10 value-label"></div>
              <span class="error-label">${errorLabel}</span>
            </div>
            <div class="loc-label ellipsis-10">
              <span>${locLabel}</span>
            </div>
          </div>
          <div class="right-label">
            ${statsRawEl}
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

  // makeParentThreadDecoration() {
  //   const { children } = this.state;
  //   const visitedColId = new Set();
  //   const decorations = [];
  //   for (const nodeData of children) {
  //     const { colId, parentRowId } = nodeData;
  //     if (!visitedColId.has(colId) && parentRowId) {
  //       visitedColId.add(colId);
  //       const positionProp = makeGridPositionProp(parentRowId, colId);
  //       decorations.push(/*html*/`
  //       <div class="async-node full-width flex-row align-center" style="${positionProp}">
  //         <div class="async-detail flex-column cross-axis-align-center">⬤</div>
  //       </div>
  //       `);
  //     }
  //   }
  //   return decorations.join('');
  // }

  makeAsyncEdgeDecoration(nodeData) {
    const {
      asyncNode,
      rowId,
      colId,
      parentEdges,
      lastForkSiblingNodeId,
    } = nodeData;

    const {
      applicationId,
    } = asyncNode;

    let html = '';
    for (const { edgeType: parentEdgeType, parentAsyncNodeId } of parentEdges) {
      if (AsyncEdgeType.is.Chain(parentEdgeType)) {
        const parentAsyncNode = this.allNodeData.get(applicationId, parentAsyncNodeId);
        {
          const _row = parentAsyncNode.rowId + 1;
          const _col = Math.max(parentAsyncNode.colId, colId);
          const _height = rowId - _row;
          if (_height > 0) {
            const positionProp = makeGridPositionProp(_row, _col, { rowSpan: _height });
            html += /*html*/ `
                <div style="${positionProp}" class="vt"></div>
              `;
          }
        }
      }
      else if (AsyncEdgeType.is.Fork(parentEdgeType)) {
        const parentAsyncNode = this.allNodeData.get(applicationId, parentAsyncNodeId);
        {
          // horizontal line
          let _col = parentAsyncNode.colId + parentAsyncNode.width;
          if (lastForkSiblingNodeId) {
            const lastForkSibling = this.allNodeData.get(applicationId, lastForkSiblingNodeId);
            _col = lastForkSibling.colId + 1;
          }
          const _width = colId - _col;
          if (_width > 0) {
            const positionProp = makeGridPositionProp(parentAsyncNode.rowId, _col, { colSpan: _width });
            html += /*html*/ `
              <div style="${positionProp}" class="hz-d"></div>
              `;
          }
        }
        {
          // vertical line
          const _height = rowId - parentAsyncNode.rowId - 1;
          if (_height > 0) {
            const positionProp = makeGridPositionProp(parentAsyncNode.rowId + 1, colId, { rowSpan: _height });
            html += /*html*/ `
                <div style="${positionProp}" class="vt-d"></div>
              `;
          }
        }
        {
          // corner
          const positionProp = makeGridPositionProp(parentAsyncNode.rowId, colId);
          html += /*html*/ `
              <div style="${positionProp}" class="t-d"></div>
            `;
        }
      }
    }
    return html;
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

  renderRootValueLabel() {
    this.allNodeData.forEach((nodeData) => {
      const valueLabelEl = this.getAsyncNodeEl(nodeData.asyncNode, '.value-label');
      valueLabelEl.innerHTML = nodeData.valueLabel;
    });
  }

  // ###########################################################################
  // event handlers
  // ###########################################################################

  handleClickAsyncNode(asyncNodeData) {
    const { asyncNode: { applicationId, asyncNodeId }, valueTraceId } = asyncNodeData;

    if (this.context.graphDocument.state.valueMode && valueTraceId) {
      this.remote.gotoValueTrace(applicationId, asyncNodeId, valueTraceId);
    }
    else if (applicationId && asyncNodeId) {
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

  handleClickErrorLabel(asyncNodeData) {
    const { applicationId, asyncNodeId, rootContextId } = asyncNodeData.asyncNode;

    if (applicationId && rootContextId) {
      this.remote.selectError(applicationId, asyncNodeId, rootContextId);
    }
  }

  /**
   * @param {{applicationId: number, asyncNodeId: number}} asyncNode 
   * @return {HTMLElement}
   */
  getAsyncNodeEl({ applicationId, asyncNodeId }, childSelector = null) {
    const data = {
      'application-id': applicationId,
      'async-node-id': asyncNodeId,
    };
    const dataSelector = Object.entries(data).map(([key, val]) => `[data-${key}="${val || ''}"]`).join('');
    let selector = `.async-node${dataSelector}`;
    if (childSelector) {
      selector = `${selector} ${childSelector}`;
    }
    return document.querySelector(selector);
  }

  reportAsyncNodeElNotExists(asyncNode, functionName) {
    const functionNameLabel = functionName ? `[${functionName}] ` : '';
    const err = new Error(`${functionNameLabel}Cannot find DOM of asyncNode: ${JSON.stringify(asyncNode)} when trying to focus`);
    this.logger.warn(err);
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
        this.reportAsyncNodeElNotExists(asyncNode, 'focusAsyncNode');
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
          this.reportAsyncNodeElNotExists(asyncNode, 'selectAsyncNode');
        }
      }
    },

    /**
     * @param {{applicationId: number, asyncNodeId: number}[]} asyncNodes 
     * @param {boolean} ignoreFailed 
     */
    highlightStack: (asyncNodes) => {
      document.querySelectorAll('.async-node.async-cell-stack-highlight').forEach(node => {
        node.classList.remove('async-cell-stack-highlight');
      });
      if (asyncNodes) {
        asyncNodes.forEach((asyncNode) => {
          const asyncNodeEl = this.getAsyncNodeEl(asyncNode);
          if (asyncNodeEl) {
            asyncNodeEl.classList.add('async-cell-stack-highlight');
          }
          else {
            this.reportAsyncNodeElNotExists(asyncNode, 'highlightStack');
          }
        });
      }
    },
    highlightSyncRoots: (asyncNodes) => {
      document.querySelectorAll('.async-node.async-cell-sync-root-highlight').forEach(node => {
        node.classList.remove('async-cell-sync-root-highlight');
      });
      if (asyncNodes) {
        asyncNodes.forEach((asyncNode) => {
          const asyncNodeEl = this.getAsyncNodeEl(asyncNode);
          if (asyncNodeEl) {
            asyncNodeEl.classList.add('async-cell-sync-root-highlight');
          }
          else {
            this.reportAsyncNodeElNotExists(asyncNode, 'highlightSyncRoots');
          }
        });
      }
    },
    updateRootValueLabel(values) {
      this.allNodeData.forEach((node) => {
        // default label if no value
        node.valueLabel = '';
        node.valueTraceId = null;
      });
      if (values) {
        values.forEach(({ applicationId, asyncNodeId, label, valueTraceId }) => {
          const asyncNodeData = this.allNodeData.get(applicationId, asyncNodeId);
          if (asyncNodeData) {
            asyncNodeData.valueLabel = label;
            asyncNodeData.valueTraceId = valueTraceId;
          }
          else {
            Verbose && this.logger.warn(`[updateRootValueLabel] update before asyncNodeData is set.`);
          }
        });
      }
      this.renderRootValueLabel();
    }
  }
}
export default AsyncGraph;

// ###########################################################################
// util
// ###########################################################################

function makeGridPositionProp(row, col, { rowSpan = 1, colSpan = 1, noHeaderPadding = false } = EmptyObject) {
  const headerPadding = noHeaderPadding ? 0 : 1;
  return `grid-row: ${row + headerPadding} / span ${rowSpan};grid-column: ${col} / span ${colSpan};`;
}
