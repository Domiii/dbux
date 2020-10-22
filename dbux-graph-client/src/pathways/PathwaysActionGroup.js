import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysActionGroup extends ClientComponentEndpoint {
  createEl() {
    const { themeMode } = this.context;
    const {
      type,
      iconUri
    } = this.state;

    return compileHtmlElement(/*html*/`<div>
      <div class="flex-row">
        <div>
          <button data-el="btn" class="btn btn-primary flex-row no-padding" style="background: transparent;">
            <img width="20px" data-el="icon" src="${iconUri}">
            <span data-el="searchTerm"></span>
          </button>
        </div>
        <div class="flex-row" data-mount="PathwaysAction"></div>
      </div>
    </div>`);
  }

  update() {
    // const { themeMode } = this.context;
    const {
      type,
      typeName,
      searchTerm
    } = this.state;

    this.els.icon.title = typeName;
    searchTerm && (this.els.searchTerm.textContent = searchTerm);
  }

  on = {
    btn: {
      click(evt) {
        if (this.state.hasTrace) {
          this.context.view.remote.selectGroupTrace(this.state.id);
        }
        document.getSelection().removeAllRanges();
      }
    }
  };
}

export default PathwaysActionGroup;