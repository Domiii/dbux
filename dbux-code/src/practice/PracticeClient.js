import axios from 'axios';

export default class PracticeClient {
  init() {
    // Set config defaults when creating the instance
    this._client = axios.create({
      baseURL: 'localhost:4040' // TODO: fix for deployment
    });
  }

  /**
   * Prompt user to login via Github
   * @see https://github.com/microsoft/vscode/issues/91309
   * @see https://github.com/microsoft/vscode/issues/91571
   */
  async login() {
    // TODO: get authToken + accountName
    // this.authToken

    // Alter defaults after instance has been created
    this._client.defaults.headers.common.Authorization = this.authToken;
  }

  async loginIfNecessary() {
    if (!this.authToken) {
      await this.login();
    }
  }

  async send(packet) {
    // TODO: use LogQueue
    // TODO: persist LogQueue to disk -> send when back online, in case someone works while offline etc.
  }

  async sendNow(packets) {
    await this.loginIfNecessary();

    await this._client.put('/data', packets);
  }
}