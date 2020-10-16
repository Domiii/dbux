import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysAction extends ClientComponentEndpoint {
  createEl() {
    const { themeMode } = this.context;
    const {
      type,
      iconUri
    } = this.state;

    return compileHtmlElement(/*html*/`<div style="border: 1px solid blue;">
    <image width="32px" data-el="icon" src="${iconUri}">
      <div class="flex-row" data-mount="PathwaysAction"></div>
    </div>`);
  }

  update() {
    const { themeMode } = this.context;
    const {
      type,
      typeName
    } = this.state;
    this.els.icon.title = typeName;
  }
}

export default PathwaysAction;