import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '../../util/domUtil';

class ThreadColumn extends ClientComponentEndpoint {
  createEl() {
    const el = compileHtmlElement(/*html*/`
      <div class="flex-column vertical-align-center">
        <div data-el="title"></div>
        <div>
          <div data-mount="AsyncNode" class="node-children flex-row"></div>
        </div>
      </div>
    `);

    return el;
  }

  update() {
    const { threadId } = this.state;
    this.els.title.innerHTML = threadId;
  }
}

export default ThreadColumn;