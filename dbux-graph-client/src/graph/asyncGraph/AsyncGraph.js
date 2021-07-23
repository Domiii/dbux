import { compileHtmlElement, getMatchParent } from '../../util/domUtil';
import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';

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
      const asyncNode = getMatchParent('div.async-node', event.target, this.el);
      if (asyncNode) {
        if (event.target.matches('button.async-node-button')) {
          // TODO: handle different buttons(blocked: thread selection)
          this.handleClickForkButton(asyncNode);
        }
        else {
          this.handleClickAsyncNode(asyncNode);
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

  makeAsyncNodeEl(child) {
    const {
      asyncNode,
      rowId,
      colId,
      displayName,
      locLabel,
      syncInCount,
      syncOutCount,
      parentAsyncNodeId,
    } = child;

    const dotLabel = '⬤';
    const { asyncNodeId, applicationId } = asyncNode;

    const forkButton = parentAsyncNodeId ? /*html*/`
        <button class="async-node-button">🢄</button>
      ` : '';
    const syncInButton = syncInCount ? /*html*/`
        <button class="async-node-button">🡅</button>
      ` : '';
    const syncOutButton = syncOutCount ? /*html*/`
        <button class="async-node-button">🡇</button>
      ` : '';
    const buttons = [forkButton, syncInButton, syncOutButton].join('');
    const data = {
      'async-node-id': asyncNodeId,
      'parent-async-node-id': parentAsyncNodeId,
      'application-id': applicationId
    };
    const dataAttrs = Object.entries(data).map(([key, val]) => `data-${key}="${val || ''}"`).join(' ');
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

  handleClickAsyncNode(asyncNode) {
    const { asyncNodeId, applicationId } = asyncNode.dataset;
    if (asyncNodeId) {
      this.remote.gotoAsyncNode(applicationId, asyncNodeId);
    }
  }

  handleClickForkButton(asyncNode) {
    const { parentAsyncNodeId, applicationId } = asyncNode.dataset;
    if (parentAsyncNodeId) {
      this.remote.gotoAsyncNode(applicationId, parentAsyncNodeId);
    }
  }
}
export default AsyncGraph;