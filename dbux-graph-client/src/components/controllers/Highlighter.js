import ClientComponentEndpoint from '@/componentLib/ClientComponentEndpoint';

export default class Highlighter extends ClientComponentEndpoint {
  init() {
    const {
      highlighterBtn
    } = this.owner.els;

    this.highlighterEl = highlighterBtn;


    this.highlighting = false;
    this.owner.dom.addEventListeners(this);
  }


  update() {
    const { enabled } = this.state;
    if (enabled) {
      this.highlighterEl.classList.add('highlight');
    } else {
      this.highlighterEl.classList.remove('highlight');
    }
  }

  on = {
    highlighterBtn: {
      click: () => {
        if (!this.highlighting) {
          this.highlighting = !this.highlighting;
          this.highlighterEl.innerHTML = "🔅";
          this.remote.inc();
        } else {
          this.highlighting = !this.highlighting;
          this.highlighterEl.innerHTML = "🔆";
          this.remote.dec();
        }
      }
    }
  }
}