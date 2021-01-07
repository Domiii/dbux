import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class PathwaysTimeline extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div style="position: relative; margin: 5px 1px;">
      <div id="pathways-timeline" class="flex-row" data-el="timeline"></div>
      <div id="pathways-timeline-stale-cover" class="flex-row full-width hidden" data-el="staleCover"></div>
    </div>`);
  }

  update() {
    const { steps, staleIntervals } = this.state;

    if (steps?.length) {
      const totalTimeSpent = steps.reduce((sum, step) => sum + step.timeSpent, 0);
      const stepDOM = steps.map(({ tag, background, timeSpent }) => {
        const backgroundStyle = background ? `background: ${background};` : '';
        return `<div style="${backgroundStyle} width: ${timeSpent / totalTimeSpent * 100}%;">${/*tag*/''}</div>`;
      }).join('');
      const startTime = steps[0].createdAt;
      const endTime = startTime + totalTimeSpent;
      const staleCovers = [];
      let currentStart = startTime;
      for (const interval of staleIntervals) {
        staleCovers.push(this.makeStaleCoverDOM(false, currentStart, interval.start, totalTimeSpent));
        staleCovers.push(this.makeStaleCoverDOM(true, interval.start, interval.end, totalTimeSpent));
        currentStart = interval.end;
      }
      staleCovers.push(this.makeStaleCoverDOM(false, currentStart, endTime, totalTimeSpent));

      this.els.timeline.innerHTML = stepDOM;
      this.els.staleCover.innerHTML = staleCovers.join('');
    }
    else {
      this.els.timeline.innerHTML = '';
      this.els.staleCover.innerHTML = '';
    }
  }

  makeStaleCoverDOM(isStale, start, end, totalTimeSpent) {
    const widthPercentage = Math.max((end - start) / totalTimeSpent * 100, 0);
    const staleClassName = isStale ? 'stale' : '';
    return `<div style="width: ${widthPercentage}%;" class="${staleClassName}"></div>`;
  }
}

export default PathwaysTimeline;