import { compileHtmlElement } from '@/util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class ContextNode extends ClientComponentEndpoint {
  get popperEl() {
    return window._popperEl;
  }

  createEl() {
    return compileHtmlElement(/*html*/`
      <div class="context">
        <div>
          <button data-el="nodeToggleBtn" class="nodeToggleBtn">▽</button>
        </div>
        <div class="full-width flex-column">
          <div data-el="title" class="title">
            <div style="display:flex; height:auto; align-item:flex-end;">
              <div class="flex-row">
                <div data-el="displayName,popperTarget" class="displayName" aria-dsecribedby="tooltip">
                </div>
                <div data-el="where" class="darkgray">
                </div>
                <button data-el="highlighterBtn">🔆</button>
              </div>
            </div>
            <div data-mount="TraceNode"></div>
          </div>
          <div data-mount="ContextNode" data-el="nodeChildren" class="children">
          </div>
        </div>
      </div>
      `);
  }

  update() {
    const {
      displayName,
      positionLabel,
      applicationId,
      context: { contextId, staticContextId }
    } = this.state;

    this.el.id = `application_${applicationId}-context_${contextId}`;
    this.el.style.background = `hsl(${this.getBinaryHsl(staticContextId)},50%,75%)`;
    this.els.title.id = `name_${contextId}`;
    //this.els.title.textContent = `${displayName}#${contextId}`;
    this.els.displayName.textContent = `${displayName}`;
    this.els.displayName.setAttribute('popper-string', `${displayName}`);
    this.els.where.textContent = positionLabel;
    this.els.nodeChildren.id = `children_${contextId}`;
  }

  getBinaryHsl(i) {
    let color = 0;
    let base = 180;
    while (i !== 0) {
      color += (i % 2) * base;
      i = Math.floor(i / 2);
      base /= 2;
    }
    return color;
  }

  on = {
    displayName: {
      click(evt) {
        // const graphNode = this.controllers.getComponent('GraphNode');
        // console.log(graphNode.isDOMExpanded());

        if (evt.shiftKey) {
          const { context, applicationId } = this.state;
          this.remote.showContext(applicationId, context.contextId);
        }
      }
    }
  }
}
export default ContextNode;