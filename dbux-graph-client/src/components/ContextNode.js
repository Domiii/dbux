import { compileHtmlElement } from 'src/util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class ContextNode extends ClientComponentEndpoint {
  titleEl;
  childrenEl;

  initEl() {
    const el = compileHtmlElement(/*html*/`
    <div class="context">
      <h3 class="title"></h3>
      <div class="children"></div>
    </div>
    `);

    this.titleEl = el.querySelector('title');
    this.childrenEl = el.querySelector('children');

    return el;
  }

  update() {
    const { contextId, displayName } = this.state;
    
  }
}

export default ContextNode;