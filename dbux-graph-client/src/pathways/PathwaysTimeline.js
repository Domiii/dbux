import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysTimeline extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div id="pathways-timeline" class="flex-row"></div>`);
  }

  update() {
    const { steps } = this.state;

    this.el.innerHTML = this.makeStepsDOM(steps);
  }

  /**
   * 
   * @param {Array<{tag, background, timeSpent}>} steps 
   */
  makeStepsDOM(steps) {
    const totalTimeSpent = steps.reduce((sum, step) => sum + step.timeSpent, 0);
    return steps.map(({ tag, background, timeSpent }) => {
      return `<div style="background: ${background}; width: ${timeSpent / totalTimeSpent * 100}%;">${tag}</div>`;
    }).join('');
  }
}

export default PathwaysTimeline;