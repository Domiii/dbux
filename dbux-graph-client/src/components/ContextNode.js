import { compileHtmlElement } from '@/util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class ContextNode extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div class="context">
        <h3 data-el="title"></h3>
        <div data-mount="ContextNode" class="children"></div>
      </div>
    `);
  }

  update() {
    const { contextId, displayName } = this.state;

    this.els.title.textContent = `${displayName}#${contextId}`;
  }
}

export default ContextNode;