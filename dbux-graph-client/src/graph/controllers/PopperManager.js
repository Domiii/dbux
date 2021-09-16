import isString from 'lodash/isString';
import { newLogger } from '@dbux/common/src/log/logger';
import { createPopper } from '@popperjs/core';
import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '../../util/domUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('PopperController');

export default class PopperManager extends ClientComponentEndpoint {
  /**
   * Owner requirements:
   * #onlyUseOnce
   *  el `tooltip`: with attribute [id='tooltip', role='tooltip']
   *  context.graphDocument.panzoom
   */
  init() {
    this.popper = null;
    this.tooltipContainer = compileHtmlElement(`
      <div id="tooltip" role="tooltip">
        <span></span>
        <!--<div id="arrow" data-popper-arrow></div>-->
      </div>`
    );
    this.owner.el.appendChild(this.tooltipContainer);
  }

  update = () => {
    this.popper?.update();
  }

  // ###########################################################################
  //  Public
  // ###########################################################################

  /**
   * @param {string|HTMLElement} tooltip
   */
  show = (target, tooltip) => {
    this._create(target, tooltip);
    this._show();
  }

  hide = () => {
    this._hide();
    this._destroy();
  }

  // ###########################################################################
  //  Private
  // ###########################################################################

  // Note: We set [data-show] attr of `popper template`(not popper instance itself) in order to show/hide it
  // see: https://popper.js.org/docs/v2/tutorial/#functionality
  _show = () => {
    this.tooltipContainer.setAttribute('data-show', '');
  }

  _hide = () => {
    this.tooltipContainer.removeAttribute('data-show');
  }

  /**
   * @param {string|HTMLElement} tooltip
   */
  _create = (target, tooltip) => {
    this._destroy();
    if (tooltip instanceof HTMLElement) {
      this.tooltipContainer.innerHTML = '';
      this.tooltipContainer.appendChild(tooltip);
      this.popper = createPopper(target, this.tooltipContainer);
    }
    else if (isString(tooltip)) {
      this.tooltipContainer.innerHTML = `<span>${tooltip}</span>`;
      this.popper = createPopper(target, this.tooltipContainer);
    }
    else {
      logError('TypeError: param `tooltip` must be a string, received', tooltip);
    }
  }

  _destroy = () => {
    this.popper?.destroy();
    this.popper = null;
  }
}