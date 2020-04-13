import exec from '../util/exec';

/**
 * TODO: allow for custom editor API, not just VScode
 */
export default class EditorApi {
  async openFolder(path) {
    await exec(`code --add ${path}`, { silent: false }, true);
  }
}