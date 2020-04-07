import { compileHtmlElement } from '@/util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class ContextNode extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div class="context">
        <span data-el="title"></span>
        <div data-mount="ContextNode" class="children"></div>
      </div>
    `);
  }

  update() {
    const {
      displayName,
      context: { contextId }
    } = this.state;

    this.els.title.textContent = `${displayName}#${contextId}`;
  }
}

export default ContextNode;