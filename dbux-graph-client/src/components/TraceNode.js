import { compileHtmlElement } from '@/util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

export default class TraceNode extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div class="trace">
        <div data-el="name" class="name">
          <span data-el="displayName"></span>
        </div>
        <div data-mount="ContextNode" class="children">
          <div class="childHead">&nbsp;</div>
        </div>
      </div>
    `);
  }

  update() {
    const {
      displayName,
      trace: {
        traceId
      }
    } = this.state;

    this.el.id = `trace_${traceId}`;
    this.els.displayName.textContent = `${displayName}`;
  }
}