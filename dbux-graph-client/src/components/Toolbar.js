import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '@/util/domUtil';

class Toolbar extends ClientComponentEndpoint {

  // ###########################################################################
  // createEl
  // ###########################################################################

  createEl() {
    return compileHtmlElement(/*html*/`
      <nav class="navbar sticky-top navbar-expand-lg navbar-light bg-light">
        <a data-el="hi" class="navbar-brand" href="#">Dbux</a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav mr-auto">
            <li class="nav-item">
              <a data-el="hi2" class="nav-link" href="#">hi!</a>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                。。。
              </a>
              <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                <a class="dropdown-item" href="https://github.com/Domiii/dbux">Github</a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" href="#">(...)</a>
              </div>
            </li>
          </ul>
          <form class="form-inline my-2 my-lg-0">
            <input class="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search">
            <button class="btn btn-outline-success my-2 my-sm-0" type="submit">🔍</button>
          </form>
        </div>
      </nav>
    `);
  }

  // ###########################################################################
  // update
  // ###########################################################################

  update() {
    const { count } = this.state;
    this.els.hi.textContent = `hi! (${count})`;
  }

  // ###########################################################################
  // event listeners
  // ###########################################################################

  on = {
    home: {
      click(evt) {
        evt.preventDefault();
        this.remote.gotoHome();
      }
    },

    hi: {
      click(evt) {
        evt.preventDefault();
        this.remote.addHi(2);
      },

      focus(evt) {
        evt.target.blur();
      }
    }
  }
}

export default Toolbar;