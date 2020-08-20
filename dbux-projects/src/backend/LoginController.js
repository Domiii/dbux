import { promises as fs } from 'fs';

import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('LoginController');

export function makeLoginController(WebviewWrapper) {
  class LoginController extends WebviewWrapper {
    constructor() {
      super('dbux-firebase-login', 'Dbux Login (Firebase)');
    }

    async buildClientHtml() {
      const htmlPath = this.getResourcePath('dist', 'projects', 'login.html');
      return await fs.readFile(htmlPath, "utf8");
    }

    async startHost(ipcAdapter) {
      
    }

    shutdownHost() {
      
    }
  }

  return new LoginController();
}