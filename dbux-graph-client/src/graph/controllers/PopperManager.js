import isString from 'lodash/isString';
import { newLogger } from '@dbux/common/src/log/logger';
import { createPopper } from '@popperjs/core';
import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '../../util/domUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('PopperController');

export default class PopperManager extends ClientComponentEndpoint {
  /**
   * Owner requirement:
   * #onlyUseOnce
   *  el `tooltip`: with attribute [id='tooltip', role='tooltip']
   *  ?property `panzoom`
   */
  init() {
    this.popper = null;
    this.tooltip = compileHtmlElement(`
      <div data-el="toolTip" id="tooltip" role="tooltip">
        <span></span>
        <div id="arrow" data-popper-arrow></div>
      </div>`
    );
    this.owner.el.appendChild(this.tooltip);

    // regist update function if owner controls panzoom
    const { panzoom } = this.context.graphDocument;
    if (panzoom) {
      panzoom.on('zoom', (/* e */) => {
        this.update();
      });

      panzoom.on('transform', (/* e */) => {
        this.update();
      });
    }
  }

  update = () => {
    this.popper?.update();
  }

  // ###########################################################################
  //  Public
  // ###########################################################################

  /**
   * @param {string} str
   */
  show = (target, str) => {
    this._create(target, str);
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
    this.tooltip.setAttribute('data-show', '');
  }

  _hide = () => {
    this.tooltip.removeAttribute('data-show');
  }

  /**
   * @param {string} tooltip
   */
  _create = (target, tooltip) => {
    if (!isString(tooltip)) {
      logError('TypeError: param `tooltip` must be a string, received', tooltip);
      return;
    }
    this._destroy();
    this.tooltip.firstChild.textContent = tooltip;
    this.popper = createPopper(target, this.tooltip, {
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        },
      ],
    });
  }

  _destroy = () => {
    this.popper?.destroy();
    this.popper = null;
  }
}