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
          <button data-el="btn" class="btn btn-primary flex-row no-padding" style="display:flex; background: transparent;">
            <img width="20px" data-el="icon" src="${iconUri}">
            <div class="action-text" data-el="searchTerm"></div>
            <div class="action-text" data-el="annotation"></div>
          </button>
        </div>
        <div class="flex-row flex-warp" data-mount="PathwaysAction"></div>
      </div>
    </div>`);
  }

  update() {
    // const { themeMode } = this.context;
    const {
      type,
      typeName,
      searchTerm,
      annotation,
      background,
      needsDivider
    } = this.state;

    this.el.style.background = background;
    this.els.icon.title = typeName;
    if (searchTerm) {
      this.els.searchTerm.textContent = searchTerm;
      this.els.searchTerm.title = searchTerm;
    }
    if (annotation) {
      this.els.annotation.textContent = annotation;
      this.els.annotation.title = annotation;
    }
    if (needsDivider) {
      this.el.classList.add('step-divider');
    }
    else {
      this.el.classList.remove('step-divider');
    }
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