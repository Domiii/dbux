import { createPopper } from '@popperjs/core';

class PopperManeger {
  constructor() {
    this.popperInstance = null;
    this.arrow = document.querySelector('#arrow');
  }
  create = (button, tooltip) => {
    this.popperInstance = createPopper(button, tooltip, {
      // placement: 'right'
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

  destroy = (tooltip) => {
    if (this.popperInstance) {
      this.popperInstance.destroy(tooltip);
      this.popperInstance = null;
    }
  }

  show = (button, tooltip) => {
    tooltip.setAttribute('data-show', '');
    this.create(button, tooltip);
  }

  hide = (tooltip) => {
    tooltip.removeAttribute('data-show');
    this.destroy();
  }

  update = () => {
    if (this.popperInstance) {
      this.popperInstance.update();
    }
  }
}
let popperManeger = new PopperManeger();
export default popperManeger;