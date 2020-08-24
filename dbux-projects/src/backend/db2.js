// TODO: merge with db.js, once latest version is in dev
import { newLogger } from '@dbux/common/src/log/logger';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Db');


const MergeTrue = Object.freeze({ merge: true });

export class Db {
  containersByName = new Map();

  constructor() {
    this.fs = firebase.firestore();

    // TODO: monitor firestore connection status and call `tryReplayBacklog` before doing anything other write action
  }

  // ###########################################################################
  // containers
  // ###########################################################################

  registerContainer(container) {
    this.containersByName.set(container.name, container);
  }

  getContainer(name) {
    return this.containersByName[name];
  }

  // ###########################################################################
  // add + write
  // ###########################################################################

  async add(container, data) {
    const id = null; // will generate new random id
    return this.write(container, id, data);
  }

  async write(container, id, data) {
    const writeRequest = {
      containerName: container.name,
      id,
      data
    };

    if (this.hasBacklog()) {
      // make sure that all write requests are in correct order
      this.addBackLog(writeRequest);
      return null;
    }
    else {
      try {
        return this._doWrite(writeRequest);
      }
      catch (err) {
        // failed to write
        this.addBackLog(writeRequest);
      }
    }
  }

  // ###########################################################################
  // backlog
  // ###########################################################################

  hasBacklog() {
    // TODO: implement this
    return false;
  }

  /**
   * Remember write action and try again later.
   */
  async addBacklog(writeRequest) {
    // TODO: remember backlog
  }

  /**
   * If backlog is corrupted, allow user to reset everything.
   */
  async resetBacklog() {
    // TODO: reset backlog
  }

  async tryReplayBacklog() {
    // TODO

    // for (const writeRequest of ...) {
    //   try {
    //     await this._doWrite(writeRequest)
    //     // success
    //   }
    //   catch (err) {
    //     // fail: stop replaying backlog for now (will try again later)
    //     throw new Error(`Could not replay backlog: ${err.message}`);
    //   }
    // }
  }

  // ###########################################################################
  // write implementation
  // ###########################################################################

  waitForWriteFinish = async () => {
    // wait until it's our turn
    await this._writePromise?.then(this.waitForWriteFinish);
  }

  async _doWrite(request) {
    await this.waitForWriteFinish();
    const {
      containerName,
      id,
      data
    } = request;
    const container = this.getContainer(containerName);
    if (!container) {
      // TODO: handle this better?
      warn(`Ignoring invalid write request. Container does not exist: "${containerName}"`);
      return;
    }

    const { collection } = container;
    const doc = collection.doc(id);
    try {
      return this._writePromise = doc.set(data, MergeTrue);
    }
    catch (err) {
      warn(`Failed to write to DB (at ${container.name}): ${err.stack}`);
      throw err;
    }
  }
}

let db;
export default function getDb() {
  if (!db) {
    db = new Db();
  }
  return db;
}