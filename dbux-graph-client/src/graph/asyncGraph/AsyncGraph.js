import { compileHtmlElement, getMatchParent } from '../../util/domUtil';
import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';
import { AsyncButtonClasses } from './asyncButtons';

class AsyncGraph extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div class="graph-root">
        <h4>Applications:</h4>
        <pre data-el="applications"></pre>
        <div data-el="children" class="grid async-grid"></div>
      </div>
    `);
  }

  setupEl() {
    // delegate click events
    this.el.addEventListener('click', event => {
      const asyncNodeEl = getMatchParent('div.async-node', event.target, this.el);
      if (asyncNodeEl) {
        if (event.target.matches('button.async-node-button')) {
          this.handleClickAsyncButton(asyncNodeEl, event.target);
        }
        else {
          this.handleClickAsyncNode(asyncNodeEl);
        }
      }
    });
  }

  update() {
    const { asyncGraphMode } = this.context.graphDocument.state;
    if (!asyncGraphMode) {
      this.el.classList.add('hidden');
    }
    else {
      this.el.classList.remove('hidden');
      this.setUpApplications();
      this.setUpAsyncNodes();
    }
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

  setUpAsyncNodes() {
    const { children } = this.state;
    if (children?.length) {
      this.els.children.innerHTML = children.map(child => this.makeAsyncNodeEl(child)).join('');
    }
    else {
      this.els.children.textContent = '(no async event recorded)';
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
    const buttons = this.makeAsyncButtons(nodeData);
    const asyncNodeData = {
      'async-node-id': asyncNodeId,
      'application-id': applicationId
    };
    const dataAttrs = Object.entries(asyncNodeData).map(([key, val]) => `data-${key}="${val || ''}"`).join(' ');
    const positionProps = `grid-column-start: ${colId};grid-row-start: ${rowId};`;

    return /*html*/`
        <div class="async-node full-width flex-row align-center" style="${positionProps}" ${dataAttrs}>
          <div class="async-brief flex-row main-axie-align-center">
            ${dotLabel}
          </div>
          <div class="async-detail flex-column cross-axis-align-center">
            <div class="flex-row">
              <div>${displayName}</div>
              ${buttons}
            </div>
            <div class="async-loc-label gray">
              <span>${locLabel}</span>
            </div>
          </div>
        </div>
      `;
  }

  makeAsyncButtons(nodeData) {
    return Object.entries(AsyncButtonClasses).map(([name, clazz]) => {
      const buttonData = clazz.makeButtonData(nodeData);
      if (buttonData) {
        const dataAttr = Object.entries(buttonData).map(([key, val]) => `data-${key}="${val || ''}"`).join(' ');
        const { label } = clazz;
        return /*html*/`<button class="async-node-button" data-button-type="${name}" ${dataAttr}>${label}</button>`;
      }
      return null;
    }).filter(x => !!x).join('');
  }

  handleClickAsyncNode(asyncNodeEl) {
    const { asyncNodeId, applicationId } = asyncNodeEl.dataset;
    if (asyncNodeId) {
      this.remote.gotoAsyncNode(applicationId, asyncNodeId);
    }
  }

  handleClickAsyncButton(asyncNodeEl, buttonEl) {
    const { buttonType } = buttonEl.dataset;
    AsyncButtonClasses[buttonType].handleClick(this, asyncNodeEl.dataset, buttonEl.dataset);
  }
}
export default AsyncGraph;