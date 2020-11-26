import { compileHtmlElement, decorateClasses } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';


class PathwaysStep extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div style="border: 1px solid lightblue; border-radius: 8px; padding: 0.1rem;">
        <div data-el="header" class="">
          <div class="flex-row space-between" >
            <div class="flex-row" data-el="title">
              <img width="22px" data-el="icon">
              <span data-el="label"></span><span style="color: #BBB" class="loc-label" data-el="locLabel"></span>
            </div>
            <div>
              <span data-el="timeSpent" class="time-spent"></span>
            </div>
          </div>
          <hr class="step-separator" style="">
        </div>
        <div class="flex-row flex-wrap" data-mount="PathwaysActionGroup">
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

    if (staticContextId) {
      this.els.title.classList.add('dbux-link');
    }
    this.el.style.background = background;

    decorateClasses(this.els.header, {
      hidden: this.context.doc.isAnalyzing()
    });
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