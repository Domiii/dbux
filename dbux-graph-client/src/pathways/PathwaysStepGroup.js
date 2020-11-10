import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysStepGroup extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div>
        <div class="flex-row space-between" >
          <div class="flex-row" data-el="title">
            <img width="24px" data-el="icon">
            <span data-el="label"></span><span style="color: #BBB" class="loc-label" data-el="locLabel"></span>
          </div>
          <div>
            <span data-el="timeSpent" class="time-spent"></span>
          </div>
        </div>
        <hr class="step-separator" style="">
        <div class="flex-row flex-wrap" data-mount="PathwaysActionGroup"></div>
      </div>
    `);
  }


  update() {
    const {
      firstStep: {
        // id,
        staticContextId,
        label,
        locLabel,
        iconUri,
        background,
        hasTrace
      },
      timeSpent
    } = this.state;

    // const { themeMode } = this.context;

    this.els.title.classList.toggle('dbux-link', hasTrace);
    this.els.icon.src = iconUri;
    this.els.label.textContent = `${label}`;
    // `id=${id}, staticContextId=${staticContextId}`
    this.els.locLabel.textContent = locLabel;

    this.els.timeSpent.textContent = timeSpent;

    if (staticContextId) {
      this.els.title.classList.add('dbux-link');
    }
    this.el.style.background = background;
  }

  on = {
    title: {
      click(evt) {
        if (this.state.firstStep.hasTrace) {
          const {
            firstStep: { id }
          } = this.state;
          this.context.view.remote.selectStepTrace(id);
        }
        document.getSelection().removeAllRanges();
      }
    }
  };
}

export default PathwaysStepGroup;