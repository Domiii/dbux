import SearchMode from '@dbux/graph-common/src/shared/SearchMode';
import { compileHtmlElement, decorateAttr, decorateClasses } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class SearchBar extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/` 
      <div class="input-group bg-light text-dark">
        <input data-el="searchInput" type="text" class="form-control" placeholder="search"/>
        <div class="input-group-append">
          <span data-el="matchLabel" class="input-group-text bg-light text-dark"></span>
          <button data-el="previousBtn" class="btn btn-outline-secondary" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>
            </svg>
          </button>
          <button data-el="nextBtn" class="btn btn-outline-secondary" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>
      </div>
    `);
  }

  setupEl() {
    this.originMode = this.state.mode;

    // hide search bar on `ESC` is pressed
    document.addEventListener('keydown', async (event) => {
      if (event.key === 'Escape') {
        //if esc key was not pressed in combination with ctrl or alt or shift
        const isNotCombinedKey = !(event.ctrlKey || event.altKey || event.shiftKey);
        if (isNotCombinedKey) {
          if (this.state.mode !== SearchMode.None) {
            await this.remote.setSearchMode(SearchMode.None);
          }
        }
      }
    });
  }

  // ###########################################################################
  // update
  // ###########################################################################

  update = () => {
    const {
      mode,
      index,
      count,
      searchTerm,
    } = this.state;

    decorateClasses(this.el, {
      hidden: mode === SearchMode.None
    });

    // auto focus on open
    if (this.originMode !== mode) {
      this.els.searchInput.focus();
    }
    this.originMode = mode;

    if (!count) {
      this.els.previousBtn.setAttribute('disabled', '');
      this.els.nextBtn.setAttribute('disabled', '');
    }
    else {
      this.els.previousBtn.removeAttribute('disabled');
      this.els.nextBtn.removeAttribute('disabled');
    }

    this.els.matchLabel.innerHTML = searchTerm ? `${index + 1}/${count}` : '(N/A)';
  }

  // ###########################################################################
  // event listeners
  // ###########################################################################

  on = {
    searchInput: {
      keydown(evt) {
        if (evt.keyCode === 13) {
          this.remote.search(evt.target.value);
        }
      }
    },
    previousBtn: {
      click(evt) {
        this.remote.previous();
      }
    },
    nextBtn: {
      click(evt) {
        this.remote.next();
      }
    }
  }
}

export default SearchBar;
