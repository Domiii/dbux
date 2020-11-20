import { compileHtmlElement, decorateClasses } from '../../util/domUtil';
import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';

class ContextNode extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div class="flex">
        <div class="full-width flex-column">
          <div class="flex-row">
            <div data-el="title"></div>
          </div>
        </div>
      </div>
      `);
  }

  update() {
    const {
      threadId,
      contextId
    } = this.state;

    this.els.title.innerHTML = `${threadId}_${contextId}`;
  }
}
export default ContextNode;