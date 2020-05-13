import ClientComponentEndpoint from '@/componentLib/ClientComponentEndpoint';

export default class Highlighter extends ClientComponentEndpoint {
  init() {
    this.owner.dom.addEventListeners(this);
  }


  update() {
    const { enabled } = this.state;
    const {
      highlighterBtn
    } = this.owner.els;
    const { el } = this.owner;

    if (enabled) {
      el.classList.add('highlight');
      highlighterBtn.textContent = "🔆";      
    } else {
      el.classList.remove('highlight');
      highlighterBtn.textContent = "🔅";
    }
  }

  on = {
    highlighterBtn: {
      click: () => {
        if (!this.state.enabled) {
          this.remote.inc();
        } else {
          this.remote.dec();
        }
      }
    }
  }
}