/**
 * An external storage that supports both `set` and `get` functions
 */
export default class Storage {
  /**
   * Saves a key-value pair of data
   * @virtual
   * @param {string} key 
   * @param {string} data 
   */
  async set(key, value) { }

  /**
   * Get value by a given key, returns undefined when no data are stored
   * @virtual
   * @param {string} key 
   * @return {string|undefined}
   */
  get(key) { }
}