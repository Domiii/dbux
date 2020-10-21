import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';


class PathwaysStep extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div style="border: 1px solid lightblue; border-radius: 8px; padding: 0.4rem;">
        <div class="flex-row space-between" >
          <div>
            <span data-el="title">
              <img width="24px" data-el="icon">
              <span data-el="label"></span><span style="color: #BBB" class="loc-label" data-el="locLabel"></span>
            </span>
          </div>
          <div>
            <span data-el="timeSpent"></span>
          </div>
        </div>
        <hr class="step-separator" style="">
        <div class="flex-row"
          data-mount="PathwaysActionGroup">
        </div>
      </div>
    `);
  }

  update() {
    const {
      // id,
      staticContextId,
      label,
      locLabel,
      iconUri,
      timeSpent,
      background,
      hasTrace
    } = this.state;

    const { themeMode } = this.context;

    this.els.title.classList.toggle('dbux-link', hasTrace);
    this.els.icon.src = iconUri;
    this.els.label.textContent = `${label}`;
    // `id=${id}, staticContextId=${staticContextId}`
    this.els.locLabel.textContent = locLabel;
    this.els.timeSpent.textContent = timeSpent;

    if (this.state.staticContextId) {
      this.els.title.classList.add('dbux-link');
    }
    this.el.style.background = background;
  }

  on = {
    title: {
      click(evt) {
        if (this.state.hasTrace) {
          this.context.view.remote.selectStepTrace(this.state.id);
        }
        document.getSelection().removeAllRanges();
      }
    }
  };
}

export default PathwaysStep;